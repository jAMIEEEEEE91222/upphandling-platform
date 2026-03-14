import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DeviationMatrixData, MatrixRow, MatrixCell } from "@/types/analysis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ procurementId: string }> }
) {
  try {
    const { procurementId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
    }

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
      return NextResponse.json({ data: null, error: "Upphandlingen hittades inte" }, { status: 404 });
    }

    if (procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Åtkomst nekad" }, { status: 403 });
    }

    if (!procurement.analysisResult) {
      return NextResponse.json({ data: null, error: "Ingen analys hittades för denna upphandling" }, { status: 404 });
    }

    const data = buildMatrixData(procurement);

    return NextResponse.json({ data, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid hämtning av analys:", error);
    return NextResponse.json({ data: null, error: "Ett oväntat fel uppstod" }, { status: 500 });
  }
}

type ProcurementWithAnalysis = NonNullable<
  Awaited<ReturnType<typeof prisma.procurement.findUnique<{
    where: { id: string };
    include: {
      bids: { include: { lineItems: true } };
      analysisResult: { include: { itemStats: { include: { flagResults: true } } } };
    };
  }>>>
>;

function buildMatrixData(procurement: ProcurementWithAnalysis): DeviationMatrixData {
  const analysisResult = procurement.analysisResult!;

  const suppliers = Array.from(
    new Set(procurement.bids.map((b) => b.supplierName))
  ).sort();

  // Bygg lookup-map: bidId → supplierName
  const bidSupplierMap = new Map<string, string>();
  for (const bid of procurement.bids) {
    bidSupplierMap.set(bid.id, bid.supplierName);
  }

  // Bygg lookup-map: lineItemId → flagResult
  const lineItemFlagMap = new Map<
    string,
    (typeof analysisResult.itemStats)[0]["flagResults"][0]
  >();
  for (const stat of analysisResult.itemStats) {
    for (const flag of stat.flagResults) {
      lineItemFlagMap.set(flag.lineItemId, flag);
    }
  }

  // Bygg lookup: itemName (lowercase) → lineItems
  const itemsMap = new Map<
    string,
    (typeof procurement.bids)[0]["lineItems"]
  >();
  for (const bid of procurement.bids) {
    for (const item of bid.lineItems) {
      const key = item.itemName.trim().toLowerCase();
      if (!itemsMap.has(key)) {
        itemsMap.set(key, []);
      }
      itemsMap.get(key)!.push(item);
    }
  }

  let flaggedCritical = 0;
  let flaggedWarning = 0;
  const rows: MatrixRow[] = [];

  for (const itemStat of analysisResult.itemStats) {
    const row = buildMatrixRow(
      itemStat,
      itemsMap,
      suppliers,
      bidSupplierMap,
      lineItemFlagMap
    );
    rows.push(row);

    if (row.highestFlagLevel === "CRITICAL") flaggedCritical++;
    else if (row.highestFlagLevel === "WARNING") flaggedWarning++;
  }

  return {
    suppliers,
    rows,
    summary: {
      totalItems: analysisResult.totalItems,
      totalBids: analysisResult.totalBids,
      flaggedItems: analysisResult.flaggedItems,
      flaggedCritical,
      flaggedWarning,
      analyzedAt: analysisResult.analyzedAt.toISOString(),
    },
  };
}

function buildMatrixRow(
  itemStat: ProcurementWithAnalysis["analysisResult"] extends infer T
    ? T extends { itemStats: (infer U)[] } ? U : never
    : never,
  itemsMap: Map<string, ProcurementWithAnalysis["bids"][0]["lineItems"]>,
  suppliers: string[],
  bidSupplierMap: Map<string, string>,
  lineItemFlagMap: Map<string, { id: string; flagLevel: string; flagReason: string | null; zScore: number }>
): MatrixRow {
  const key = itemStat.itemName.trim().toLowerCase();
  const dbLineItems = itemsMap.get(key) || [];

  // Gruppera items per leverantör
  const supplierLineItems = new Map<string, (typeof dbLineItems)[0]>();
  for (const li of dbLineItems) {
    const supplier = bidSupplierMap.get(li.bidId);
    if (supplier) supplierLineItems.set(supplier, li);
  }

  const cells: Record<string, MatrixCell> = {};
  let highestFlagLevel: MatrixRow["highestFlagLevel"] = "NORMAL";

  for (const supplier of suppliers) {
    const lineItem = supplierLineItems.get(supplier);

    if (!lineItem) {
      cells[supplier] = {
        lineItemId: `missing-${supplier}`,
        price: null,
        flagLevel: null,
      };
      continue;
    }

    const flag = lineItemFlagMap.get(lineItem.id);

    if (flag) {
      if (flag.flagLevel === "CRITICAL") {
        highestFlagLevel = "CRITICAL";
      } else if (flag.flagLevel === "WARNING" && highestFlagLevel !== "CRITICAL") {
        highestFlagLevel = "WARNING";
      }
    }

    cells[supplier] = {
      lineItemId: lineItem.id,
      price: lineItem.price ? Number(lineItem.price) : null,
      priceNote: lineItem.priceNote,
      flagLevel: flag ? (flag.flagLevel as MatrixCell["flagLevel"]) : "NORMAL",
      flagReason: flag?.flagReason ?? null,
      zScore: flag ? flag.zScore : null,
      flagResultId: flag ? flag.id : null,
    };
  }

  const firstLi = dbLineItems[0];

  return {
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
  };
}
