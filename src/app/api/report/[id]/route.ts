import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        procurement: { select: { createdById: true, title: true } }
      }
    });

    if (!report) {
      return NextResponse.json({ data: null, error: "Rapporten hittades inte" }, { status: 404 });
    }

    if (report.procurement.createdById !== session.user.id) {
      return NextResponse.json({ data: null, error: "Åtkomst nekad" }, { status: 403 });
    }

    if (!fs.existsSync(report.filePath)) {
      return NextResponse.json({ data: null, error: "PDF-filen finns inte på servern" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(report.filePath);
    const filename = `Analysrapport_${report.procurement.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Fel vid hämtning av PDF:", error);
    return NextResponse.json({ data: null, error: "Serverfel" }, { status: 500 });
  }
}
