import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { runAnalysis } from "@/lib/analysis/engine";

const RunAnalysisSchema = z.object({
  procurementId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RunAnalysisSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "Ogiltig indata", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { procurementId } = parsed.data;

    const procurement = await prisma.procurement.findUnique({
      where: { id: procurementId },
      select: { createdById: true, status: true }
    });

    if (!procurement) {
      return NextResponse.json({ data: null, error: "Upphandlingen hittades inte" }, { status: 404 });
    }

    if (procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Åtkomst nekad" }, { status: 403 });
    }

    if (procurement.status !== "IMPORTED" && procurement.status !== "ANALYZED") {
      return NextResponse.json(
        { data: null, error: `Kan inte analysera i status: ${procurement.status}` },
        { status: 400 }
      );
    }

    const analysisResult = await runAnalysis(procurementId);

    if (!analysisResult) {
       return NextResponse.json({ data: null, error: "Serverfel vid analys" }, { status: 500 });
    }

    // Return summary
    const summary = {
      totalItems: analysisResult.totalItems,
      totalBids: analysisResult.totalBids,
      flaggedItems: analysisResult.flaggedItems,
    };

    return NextResponse.json({ data: summary, error: null }, { status: 200 });

  } catch (error) {
    console.error("Fel vid körning av analys:", error);
    return NextResponse.json({ data: null, error: "Ett oväntat fel uppstod" }, { status: 500 });
  }
}
