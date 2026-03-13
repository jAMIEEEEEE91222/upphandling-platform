import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
  }

  try {
    const procurement = await prisma.procurement.findUnique({
      where: {
        id: params.id,
      },
      include: {
        bids: {
          include: {
            lineItems: {
              include: {
                flagResult: true,
              }
            }
          }
        },
        analysisResult: true,
      },
    });

    if (!procurement) {
      return NextResponse.json({ data: null, error: "Upphandlingen hittades inte" }, { status: 404 });
    }

    if (procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Behörighet saknas" }, { status: 403 });
    }

    return NextResponse.json({ data: procurement, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid hämtning av upphandling:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
  }

  try {
    const procurement = await prisma.procurement.findUnique({
      where: { id: params.id },
      select: { createdById: true },
    });

    if (!procurement) {
      return NextResponse.json({ data: null, error: "Upphandlingen hittades inte" }, { status: 404 });
    }

    if (procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Behörighet saknas" }, { status: 403 });
    }

    await prisma.procurement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ data: { success: true }, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid borttagning av upphandling:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}
