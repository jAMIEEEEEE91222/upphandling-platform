import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { fetchReportData } from "@/lib/pdf/data-fetcher";
import { generateReportHTML } from "@/lib/pdf/report-template";
import { generatePDF } from "@/lib/pdf/generator";
import fs from "fs/promises";

const GenerateReportSchema = z.object({
  procurementId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = GenerateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "Ogiltig indata", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { procurementId } = parsed.data;

    const procurement = await prisma.procurement.findUnique({
      where: { id: procurementId },
      select: { id: true, createdById: true, status: true },
    });

    if (!procurement) {
      return NextResponse.json({ data: null, error: "Upphandlingen hittades inte" }, { status: 404 });
    }

    if (procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Åtkomst nekad" }, { status: 403 });
    }

    if (procurement.status !== "ANALYZED" && procurement.status !== "REPORTED") {
      return NextResponse.json(
        { data: null, error: `Rapport kan bara genereras när status är ANALYZED eller REPORTED` },
        { status: 400 }
      );
    }

    // 1. Fetch data
    const reportData = await fetchReportData(procurement.id);
    
    // 2. Generate HTML
    const html = generateReportHTML(reportData);
    
    // 3. Generate PDF
    const filename = `Analysrapport_${procurement.id}.pdf`;
    const filePath = await generatePDF(html, filename);

    const stats = await fs.stat(filePath);
    
    // 4. Update Database
    const report = await prisma.$transaction(async (tx) => {
      // Remove previous report record if it exists
      const existing = await tx.report.findUnique({ where: { procurementId } });
      if (existing) {
        await tx.report.delete({ where: { id: existing.id } });
      }
      
      const newReport = await tx.report.create({
        data: {
          procurementId,
          filePath,
          fileSize: stats.size,
        }
      });
      
      await tx.procurement.update({
        where: { id: procurementId },
        data: { status: "REPORTED" },
      });
      
      return newReport;
    });

    return NextResponse.json({
      data: {
        reportId: report.id,
        filePath: report.filePath,
      },
      error: null
    }, { status: 201 });

  } catch (error) {
    console.error("Fel vid skapande av PDF-rapport:", error);
    return NextResponse.json({ data: null, error: "Serverfel: " + (error instanceof Error ? error.message : "Okänt fel") }, { status: 500 });
  }
}
