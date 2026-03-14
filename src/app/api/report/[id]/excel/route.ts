import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchReportData } from "@/lib/pdf/data-fetcher";
import { generateExcelReport } from "@/lib/excel/exporter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // id is report.id
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        procurement: { select: { id: true, createdById: true, title: true } }
      }
    });

    if (!report) {
      return NextResponse.json({ data: null, error: "Rapporten hittades inte" }, { status: 404 });
    }

    if (report.procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Åtkomst nekad" }, { status: 403 });
    }

    const data = await fetchReportData(report.procurement.id);
    const buffer = await generateExcelReport(data);

    const filename = `Excelexport_${report.procurement.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Fel vid generering av Excel:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}
