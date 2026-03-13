import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ procurementId: string }> }
) {
  const { procurementId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
  }

  try {
    const procurement = await prisma.procurement.findUnique({
      where: { id: procurementId },
      select: { createdById: true }
    });

    if (!procurement || procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Behörighet saknas" }, { status: 403 });
    }

    const bids = await prisma.bid.findMany({
      where: { procurementId },
      include: {
        lineItems: true
      },
      orderBy: { importedAt: 'asc' }
    });

    return NextResponse.json({ data: bids, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid hämtning av anbud:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}
