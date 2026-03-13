import { prisma } from "@/lib/prisma";
import { 
  calculateMean, 
  calculateMedian, 
  calculateStdDev, 
  calculateZScore 
} from "./statistics";
import { 
  determineFlagLevel, 
  detectCollusion, 
  buildFlagReason,
  FlagLevel
} from "./flagging";

export async function runAnalysis(procurementId: string) {
  // 1. Fetch bids and lineItems
  const procurement = await prisma.procurement.findUnique({
    where: { id: procurementId },
    include: {
      bids: {
        include: {
          lineItems: true,
        },
      },
    },
  });

  if (!procurement) {
    throw new Error("Procurement not found");
  }

  const allLineItems = procurement.bids.flatMap(b => b.lineItems);
  
  // 2. Group lineItems by item name (case-insensitive)
  const itemGroups = new Map<string, typeof allLineItems>();
  
  for (const item of allLineItems) {
    const key = item.itemName.trim().toLowerCase();
    if (!itemGroups.has(key)) {
      itemGroups.set(key, []);
    }
    itemGroups.get(key)!.push(item);
  }

  const totalBids = procurement.bids.length;
  let flaggedItemsCount = 0;
  let totalAggregatedZScore = 0;
  let totalFlaggedZScoreCount = 0;
  let maxZScoreObserved = 0;

  const resultsToSave = [];

  // 3 & 4. Process each group
  for (const [key, items] of itemGroups.entries()) {
    const originalItemName = items[0].itemName; // Use the first actual casing
    
    // a. Filter out null prices
    const validItems = items.filter(i => i.price !== null);
    const prices = validItems.map(i => Number(i.price));

    const hasMissingPrices = prices.length < totalBids || items.some(i => i.price === null);
    const hasZeroPrices = prices.some(p => p === 0);
    const sampleSize = prices.length;

    let mean = 0, median = 0, stdDev = 0, min = 0, max = 0, priceRange = 0;
    let suspectedCollusion = false;

    if (sampleSize > 0) {
      mean = calculateMean(prices);
      median = calculateMedian(prices);
      stdDev = calculateStdDev(prices, mean);
      min = Math.min(...prices);
      max = Math.max(...prices);
      priceRange = max - min;
      suspectedCollusion = detectCollusion(prices);
    }

    const flagsForThisItem: { lineItemId: string, zScore: number, flagLevel: FlagLevel, flagReason: string | null }[] = [];
    let itemHasFlag = false;

    for (const item of items) {
      if (item.price === null) continue;
      
      const p = Number(item.price);
      const isZeroPrice = p === 0;
      const zScore = sampleSize > 1 ? calculateZScore(p, mean, stdDev) : 0;
      
      const flagLevel = determineFlagLevel(zScore, isZeroPrice);
      const flagReason = buildFlagReason(flagLevel, zScore, isZeroPrice, suspectedCollusion);

      if (flagLevel !== "NORMAL" || suspectedCollusion) {
        itemHasFlag = true;
      }

      if (flagLevel !== "NORMAL") {
        totalFlaggedZScoreCount++;
        totalAggregatedZScore += Math.abs(zScore);
        if (Math.abs(zScore) > maxZScoreObserved) {
          maxZScoreObserved = Math.abs(zScore);
        }
      }

      flagsForThisItem.push({
        lineItemId: item.id,
        zScore,
        flagLevel,
        flagReason
      });
    }

    if (itemHasFlag || suspectedCollusion) {
      flaggedItemsCount++;
    }

    resultsToSave.push({
      itemStatistic: {
        itemName: originalItemName,
        meanPrice: mean,
        medianPrice: median,
        stdDev,
        minPrice: min,
        maxPrice: max,
        priceRange,
        sampleSize,
        hasMissingPrices,
        hasZeroPrices,
        suspectedCollusion
      },
      flags: flagsForThisItem
    });
  }

  const avgZScore = totalFlaggedZScoreCount > 0 ? totalAggregatedZScore / totalFlaggedZScoreCount : 0;

  // 5. Save everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing analysis result (if any)
    const existingAnalysis = await tx.analysisResult.findUnique({
      where: { procurementId }
    });
    
    if (existingAnalysis) {
      await tx.analysisResult.delete({
        where: { id: existingAnalysis.id }
      });
    }

    // Create AnalysisResult
    const analysisResult = await tx.analysisResult.create({
      data: {
        procurementId,
        totalItems: itemGroups.size,
        totalBids,
        flaggedItems: flaggedItemsCount,
        avgZScore,
        maxZScore: maxZScoreObserved,
      }
    });

    for (const data of resultsToSave) {
      const itemStat = await tx.itemStatistic.create({
        data: {
          analysisResultId: analysisResult.id,
          ...data.itemStatistic
        }
      });

      if (data.flags.length > 0) {
        await tx.flagResult.createMany({
          data: data.flags.map(f => ({
            ...f,
            itemStatisticId: itemStat.id
          }))
        });
      }
    }

    // 6. Uppdatera Procurement.status till ANALYZED
    await tx.procurement.update({
      where: { id: procurementId },
      data: { status: "ANALYZED" }
    });

    return await tx.analysisResult.findUnique({
      where: { id: analysisResult.id },
      include: {
        itemStats: {
          include: {
            flagResults: true
          }
        }
      }
    });
  });

  return result;
}
