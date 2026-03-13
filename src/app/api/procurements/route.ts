import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateProcurementSchema } from "@/types/procurement";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
  }

  try {
    const procurements = await prisma.procurement.findMany({
      where: {
        createdById: session.user.id,
      },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        referenceNumber: true,
        createdAt: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: procurements, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid hämtning av upphandlingar:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateProcurementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "Ogiltig indata", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const procurement = await prisma.procurement.create({
      data: { ...parsed.data, createdById: session.user.id, status: "DRAFT" },
    });
    return NextResponse.json({ data: procurement, error: null }, { status: 201 });
  } catch (error) {
    console.error("Fel vid skapande av upphandling:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}
