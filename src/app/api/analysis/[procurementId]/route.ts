import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DeviationMatrixData, MatrixRow, MatrixCell } from "@/types/analysis";

export async function GET(
  request: NextRequest,
  { params }: { params: { procurementId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
    }

    const { procurementId } = params;

    const procurement = await prisma.procurement.findUnique({
      where: { id: procurementId },
      include: {
        bids: {
          include: {
            lineItems: true,
          },
        },
        analysisResult: {
          include: {
            itemStats: {
              include: {
                flagResults: true,
              },
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

    const suppliers = procurement.bids.map((b) => b.supplierName).sort();

    // Reconstruct itemgroups using original lineItems to easily get price and notes
    // Mapped by itemName lowercase
    const itemsMap = new Map<string, typeof procurement.bids[0]["lineItems"]>();
    for (const bid of procurement.bids) {
      for (const item of bid.lineItems) {
        const key = item.itemName.trim().toLowerCase();
        if (!itemsMap.has(key)) {
          itemsMap.set(key, []);
        }
        itemsMap.get(key)!.push(item);
      }
    }

    const analysisResult = procurement.analysisResult;

    let flaggedCritical = 0;
    let flaggedWarning = 0;

    const rows: MatrixRow[] = [];

    // Pre-calculate flags mapping lineItemId -> flagResult
    const lineItemFlagMap = new Map<string, typeof analysisResult.itemStats[0]["flagResults"][0]>();
    for (const itemStat of analysisResult.itemStats) {
      for (const flag of itemStat.flagResults) {
        lineItemFlagMap.set(flag.lineItemId, flag);
      }
    }

    // Bid-Id to supplier map
    const bidSupplierMap = new Map<string, string>();
    for (const bid of procurement.bids) {
      bidSupplierMap.set(bid.id, bid.supplierName);
    }

    for (const itemStat of analysisResult.itemStats) {
      const key = itemStat.itemName.trim().toLowerCase();
      const dbLineItems = itemsMap.get(key) || [];

      const cells: Record<string, MatrixCell> = {};
      let highestFlagLevel: MatrixRow["highestFlagLevel"] = "NORMAL";

      // Track flag counts for summary
      let itemHasCritical = false;
      let itemHasWarning = false;

      // Group items by supplier for this row
      const supplierLineItems = new Map<string, typeof dbLineItems[0]>();
      for (const li of dbLineItems) {
         supplierLineItems.set(bidSupplierMap.get(li.bidId)!, li);
      }

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
            itemHasCritical = true;
          } else if (flag.flagLevel === "WARNING" && highestFlagLevel !== "CRITICAL") {
            highestFlagLevel = "WARNING";
            itemHasWarning = true;
          }
        }

        cells[supplier] = {
          lineItemId: lineItem.id,
          price: lineItem.price ? Number(lineItem.price) : null,
          priceNote: lineItem.priceNote,
          flagLevel: flag ? flag.flagLevel : "NORMAL",
          flagReason: flag ? flag.flagReason : null,
          zScore: flag ? flag.zScore : null,
          flagResultId: flag ? flag.id : null,
        };
      }

      // If missing prices, any normal cell isn't technically normal, but we map no flags to normal for defined prices
      
      const firstLi = dbLineItems[0];

      rows.push({
        itemName: itemStat.itemName,
        itemCode: firstLi ? firstLi.itemCode : null,
        unit: firstLi ? firstLi.unit : null,
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

      if (itemHasCritical) flaggedCritical++;
      if (itemHasWarning && !itemHasCritical) flaggedWarning++; // If it has critical, it's counted in critical
    }

    const data: DeviationMatrixData = {
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

    return NextResponse.json({ data, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid hämtning av analys:", error);
    return NextResponse.json({ data: null, error: "Ett oväntat fel uppstod" }, { status: 500 });
  }
}
