import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateFlagSchema = z.object({
  reviewNote: z.string().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagResultId: string }> }
) {
  try {
    const { flagResultId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateFlagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "Ogiltig indata", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verifiera att flagResult existerar och tillhör användarens upphandling
    const flagResult = await prisma.flagResult.findUnique({
      where: { id: flagResultId },
      include: {
        itemStatistic: {
          include: {
            analysisResult: {
              include: {
                procurement: {
                  select: { createdById: true },
                },
              },
            },
          },
        },
      },
    });

    if (!flagResult) {
      return NextResponse.json({ data: null, error: "Flaggresultat hittades inte" }, { status: 404 });
    }

    if (flagResult.itemStatistic.analysisResult.procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Åtkomst nekad" }, { status: 403 });
    }

    const updated = await prisma.flagResult.update({
      where: { id: flagResultId },
      data: {
        reviewNote: parsed.data.reviewNote ?? null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ data: updated, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid uppdatering av flaggresultat:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}
