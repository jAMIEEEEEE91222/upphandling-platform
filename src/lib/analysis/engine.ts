import { prisma } from "@/lib/prisma";
import {
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculateZScore,
} from "./statistics";
import {
  determineFlagLevel,
  detectCollusion,
  buildFlagReason,
  type FlagLevel,
} from "./flagging";

interface ItemStatisticData {
  itemName: string;
  meanPrice: number;
  medianPrice: number;
  stdDev: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  sampleSize: number;
  hasMissingPrices: boolean;
  hasZeroPrices: boolean;
  suspectedCollusion: boolean;
}

interface FlagData {
  lineItemId: string;
  zScore: number;
  flagLevel: FlagLevel;
  flagReason: string | null;
}

interface ItemResult {
  itemStatistic: ItemStatisticData;
  flags: FlagData[];
}

/**
 * Kör statistisk analys på alla anbud för en upphandling.
 *
 * 1. Hämtar alla bids + lineItems
 * 2. Grupperar per artikelnamn (case-insensitive)
 * 3. Beräknar statistik per artikel
 * 4. Flaggar avvikande priser enligt affärsreglerna
 * 5. Sparar allt i en transaktion
 */
export async function runAnalysis(procurementId: string) {
  const procurement = await fetchProcurementWithBids(procurementId);
  const allLineItems = procurement.bids.flatMap((b) => b.lineItems);
  const itemGroups = groupByItemName(allLineItems);

  const totalBids = procurement.bids.length;
  const resultsToSave: ItemResult[] = [];
  let flaggedItemsCount = 0;
  let totalAbsZScore = 0;
  let zScoreCount = 0;
  let maxZScoreObserved = 0;

  for (const [, items] of itemGroups.entries()) {
    const result = analyzeItemGroup(items, totalBids);
    resultsToSave.push(result);

    if (result.flags.some((f) => f.flagLevel !== "NORMAL")) {
      flaggedItemsCount++;
    }

    for (const flag of result.flags) {
      if (flag.flagLevel !== "NORMAL") {
        zScoreCount++;
        totalAbsZScore += Math.abs(flag.zScore);
        if (Math.abs(flag.zScore) > maxZScoreObserved) {
          maxZScoreObserved = Math.abs(flag.zScore);
        }
      }
    }
  }

  const avgZScore = zScoreCount > 0 ? totalAbsZScore / zScoreCount : 0;

  return saveAnalysisResults(
    procurementId,
    itemGroups.size,
    totalBids,
    flaggedItemsCount,
    avgZScore,
    maxZScoreObserved,
    resultsToSave
  );
}

async function fetchProcurementWithBids(procurementId: string) {
  const procurement = await prisma.procurement.findUnique({
    where: { id: procurementId },
    include: {
      bids: {
        include: { lineItems: true },
      },
    },
  });

  if (!procurement) {
    throw new Error("Upphandlingen hittades inte");
  }

  return procurement;
}

type LineItemFromDB = Awaited<
  ReturnType<typeof fetchProcurementWithBids>
>["bids"][0]["lineItems"][0];

function groupByItemName(items: LineItemFromDB[]) {
  const groups = new Map<string, LineItemFromDB[]>();

  for (const item of items) {
    const key = item.itemName.trim().toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return groups;
}

function analyzeItemGroup(
  items: LineItemFromDB[],
  totalBids: number
): ItemResult {
  const originalItemName = items[0].itemName;

  // Filtrera bort null-priser från statistikberäkningar (affärsregel)
  const validItems = items.filter((i) => i.price !== null);
  const prices = validItems.map((i) => Number(i.price));

  const hasMissingPrices =
    items.some((i) => i.price === null) || prices.length < totalBids;
  const hasZeroPrices = prices.some((p) => p === 0);
  const sampleSize = prices.length;

  // Beräkna statistik från icke-null priser
  const stats = computeStatistics(prices);
  const suspectedCollusion = detectCollusion(prices);

  // Flagga varje lineItem
  const flags = createFlags(items, stats, suspectedCollusion);

  return {
    itemStatistic: {
      itemName: originalItemName,
      ...stats,
      sampleSize,
      hasMissingPrices,
      hasZeroPrices,
      suspectedCollusion,
    },
    flags,
  };
}

function computeStatistics(prices: number[]) {
  if (prices.length === 0) {
    return {
      meanPrice: 0,
      medianPrice: 0,
      stdDev: 0,
      minPrice: 0,
      maxPrice: 0,
      priceRange: 0,
    };
  }

  const mean = calculateMean(prices);
  const median = calculateMedian(prices);
  const stdDev = calculateStdDev(prices, mean);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    meanPrice: mean,
    medianPrice: median,
    stdDev,
    minPrice: min,
    maxPrice: max,
    priceRange: max - min,
  };
}

function createFlags(
  items: LineItemFromDB[],
  stats: ReturnType<typeof computeStatistics>,
  suspectedCollusion: boolean
): FlagData[] {
  const flags: FlagData[] = [];

  for (const item of items) {
    // Hoppa över items utan pris – de inkluderas inte i analys
    if (item.price === null) continue;

    const price = Number(item.price);
    const isZeroPrice = price === 0;

    // z-score beräknas bara om det finns >1 sample med stddev>0
    const zScore =
      stats.stdDev > 0
        ? calculateZScore(price, stats.meanPrice, stats.stdDev)
        : 0;

    const flagLevel = determineFlagLevel(
      zScore,
      isZeroPrice,
      suspectedCollusion
    );
    const flagReason = buildFlagReason(
      flagLevel,
      zScore,
      isZeroPrice,
      suspectedCollusion
    );

    flags.push({
      lineItemId: item.id,
      zScore,
      flagLevel,
      flagReason,
    });
  }

  return flags;
}

async function saveAnalysisResults(
  procurementId: string,
  totalItems: number,
  totalBids: number,
  flaggedItems: number,
  avgZScore: number,
  maxZScore: number,
  results: ItemResult[]
) {
  return prisma.$transaction(async (tx) => {
    // Ta bort befintligt analysresultat om det finns (vid omanalys)
    const existing = await tx.analysisResult.findUnique({
      where: { procurementId },
    });

    if (existing) {
      await tx.analysisResult.delete({ where: { id: existing.id } });
    }

    // Skapa nytt analysresultat
    const analysisResult = await tx.analysisResult.create({
      data: {
        procurementId,
        totalItems,
        totalBids,
        flaggedItems,
        avgZScore,
        maxZScore,
      },
    });

    // Skapa ItemStatistic + FlagResults för varje artikelgrupp
    for (const data of results) {
      const itemStat = await tx.itemStatistic.create({
        data: {
          analysisResultId: analysisResult.id,
          ...data.itemStatistic,
        },
      });

      if (data.flags.length > 0) {
        await tx.flagResult.createMany({
          data: data.flags.map((f) => ({
            ...f,
            itemStatisticId: itemStat.id,
          })),
        });
      }
    }

    // Uppdatera status till ANALYZED
    await tx.procurement.update({
      where: { id: procurementId },
      data: { status: "ANALYZED" },
    });

    return tx.analysisResult.findUnique({
      where: { id: analysisResult.id },
      include: {
        itemStats: {
          include: { flagResults: true },
        },
      },
    });
  });
}
