import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcelFile } from "@/lib/excel/parser";
import { ColumnMapping } from "@/types/import";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const procurementId = formData.get("procurementId") as string | null;
    const columnMappingStr = formData.get("columnMapping") as string | null;
    const supplierName = formData.get("supplierName") as string | null;

    if (!file || !procurementId || !columnMappingStr || !supplierName) {
      return NextResponse.json({ data: null, error: "Saknade fält" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ data: null, error: "Filen är för stor (max 50 MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
      return NextResponse.json({ data: null, error: "Ogiltigt filformat" }, { status: 400 });
    }

    // Check procurement access
    const procurement = await prisma.procurement.findUnique({
      where: { id: procurementId },
      select: { createdById: true }
    });
    if (!procurement || procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Behörighet saknas" }, { status: 403 });
    }

    const columnMapping: ColumnMapping = JSON.parse(columnMappingStr);
    
    // Validate mapping
    if (!columnMapping.itemName || !columnMapping.price) {
      return NextResponse.json({ data: null, error: "Måste mappa artikel och pris" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawData = parseExcelFile(buffer);

    // Filter and transform rows
    const itemsToCreate: Array<{
      itemName: string;
      itemCode: string | null;
      unit: string | null;
      price: number | null;
      priceNote: string | null;
    }> = [];
    let skippedRows = 0;

    for (const row of rawData.rows) {
      const name = row[columnMapping.itemName] ? String(row[columnMapping.itemName]).trim() : "";
      if (!name) {
        skippedRows++;
        continue;
      }

      const rawPrice = row[columnMapping.price];
      let price: number | null = null;
      let priceNote: string | null = null;

      if (rawPrice === 0 || rawPrice === "0") {
        price = 0;
        priceNote = "Nollpris";
      } else if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
        price = null;
      } else {
        const numPrice = Number(rawPrice);
        if (isNaN(numPrice)) {
          price = null;
          priceNote = String(rawPrice).substring(0, 100);
        } else {
          price = numPrice;
        }
      }

      itemsToCreate.push({
        itemName: name,
        itemCode: columnMapping.itemCode ? String(row[columnMapping.itemCode] ?? "") : null,
        unit: columnMapping.unit ? String(row[columnMapping.unit] ?? "") : null,
        price,
        priceNote,
      });
    }

    if (itemsToCreate.length === 0) {
      return NextResponse.json({ data: null, error: "Inga giltiga rader hittades baserat på mappningen" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: { procurementId, supplierName }
      });
      await tx.lineItem.createMany({
        data: itemsToCreate.map(item => ({ ...item, bidId: bid.id }))
      });
      await tx.procurement.update({
        where: { id: procurementId },
        data: { status: "IMPORTED" }
      });
      return bid;
    });

    return NextResponse.json({
      data: {
        bidId: result.id,
        itemCount: itemsToCreate.length,
        skippedRows
      },
      error: null
    }, { status: 201 });

  } catch (error) {
    console.error("Fel vid import av bid:", error);
    return NextResponse.json({ data: null, error: "Serverfel vid import" }, { status: 500 });
  }
}
