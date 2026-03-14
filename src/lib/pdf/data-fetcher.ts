import { prisma } from "@/lib/prisma";
import type { ReportData } from "@/types/report";

export async function fetchReportData(procurementId: string): Promise<ReportData> {
  const procurement = await prisma.procurement.findUnique({
    where: { id: procurementId },
    include: {
      bids: {
        include: { lineItems: true },
      },
      analysisResult: {
        include: {
          itemStats: {
            include: { flagResults: true },
          },
        },
      },
    },
  });

  if (!procurement) {
    throw new Error("Upphandlingen hittades inte");
  }

  if (!procurement.analysisResult) {
    throw new Error("Ingen analys finns för denna upphandling");
  }

  const analysisResult = procurement.analysisResult;
  const suppliers = Array.from(new Set(procurement.bids.map(b => b.supplierName))).sort();

  const bidSupplierMap = new Map<string, string>();
  for (const bid of procurement.bids) {
    bidSupplierMap.set(bid.id, bid.supplierName);
  }

  const lineItemFlagMap = new Map<string, typeof analysisResult.itemStats[0]["flagResults"][0]>();
  for (const stat of analysisResult.itemStats) {
    for (const flag of stat.flagResults) {
      lineItemFlagMap.set(flag.lineItemId, flag);
    }
  }

  const itemsMap = new Map<string, typeof procurement.bids[0]["lineItems"]>();
  for (const bid of procurement.bids) {
    for (const item of bid.lineItems) {
      const key = item.itemName.trim().toLowerCase();
      if (!itemsMap.has(key)) itemsMap.set(key, []);
      itemsMap.get(key)!.push(item);
    }
  }

  let flaggedCritical = 0;
  let flaggedWarning = 0;

  const items: ReportData["items"] = [];

  for (const itemStat of analysisResult.itemStats) {
    const key = itemStat.itemName.trim().toLowerCase();
    const dbLineItems = itemsMap.get(key) || [];

    const supplierLineItems = new Map<string, typeof dbLineItems[0]>();
    for (const li of dbLineItems) {
      const supplier = bidSupplierMap.get(li.bidId);
      if (supplier) supplierLineItems.set(supplier, li);
    }

    const cells: ReportData["items"][0]["cells"] = {};
    let highestFlagLevel: "NORMAL" | "WARNING" | "CRITICAL" | null = "NORMAL";

    for (const supplier of suppliers) {
      const lineItem = supplierLineItems.get(supplier);
      if (!lineItem) {
        cells[supplier] = { price: null, flagLevel: null, flagReason: null, zScore: null, reviewNote: null };
        continue;
      }

      const flag = lineItemFlagMap.get(lineItem.id);
      if (flag) {
        if (flag.flagLevel === "CRITICAL") highestFlagLevel = "CRITICAL";
        else if (flag.flagLevel === "WARNING" && highestFlagLevel !== "CRITICAL") highestFlagLevel = "WARNING";
      }

      cells[supplier] = {
        price: lineItem.price ? Number(lineItem.price) : null,
        flagLevel: flag ? (flag.flagLevel as "NORMAL" | "WARNING" | "CRITICAL") : "NORMAL",
        flagReason: flag?.flagReason ?? null,
        zScore: flag?.zScore ?? null,
        reviewNote: flag?.reviewNote ?? null,
      };
    }

    if (highestFlagLevel === "CRITICAL") flaggedCritical++;
    else if (highestFlagLevel === "WARNING") flaggedWarning++;

    const firstLi = dbLineItems[0];

    items.push({
      itemName: itemStat.itemName,
      itemCode: firstLi?.itemCode ?? null,
      unit: firstLi?.unit ?? null,
      highestFlagLevel,
      stats: {
        mean: Number(itemStat.meanPrice),
        median: Number(itemStat.medianPrice),
        stdDev: Number(itemStat.stdDev),
        min: Number(itemStat.minPrice),
        max: Number(itemStat.maxPrice),
        sampleSize: itemStat.sampleSize,
        hasMissingPrices: itemStat.hasMissingPrices,
        hasZeroPrices: itemStat.hasZeroPrices,
        suspectedCollusion: itemStat.suspectedCollusion,
      },
      cells,
    });
  }

  // Sortera: CRITICAL först, sen WARNING, sen NORMAL
  const priority = { CRITICAL: 3, WARNING: 2, NORMAL: 1 };
  items.sort((a, b) => (priority[b.highestFlagLevel || "NORMAL"] || 0) - (priority[a.highestFlagLevel || "NORMAL"] || 0));

  return {
    procurement: {
      id: procurement.id,
      title: procurement.title,
      category: procurement.category,
      referenceNumber: procurement.referenceNumber,
    },
    analysis: {
      totalItems: analysisResult.totalItems,
      totalBids: analysisResult.totalBids,
      flaggedItems: analysisResult.flaggedItems,
      flaggedCritical,
      flaggedWarning,
      analyzedAt: analysisResult.analyzedAt.toISOString(),
    },
    suppliers,
    items,
  };
}
