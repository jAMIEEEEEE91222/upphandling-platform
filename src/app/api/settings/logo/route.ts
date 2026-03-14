import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Ej autentiserad" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ data: null, error: "Ingen fil vald" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ data: null, error: "Logotypen får vara max 2MB" }, { status: 400 });
    }

    const isPng = file.type === "image/png";
    const isSvg = file.type === "image/svg+xml";

    if (!isPng && !isSvg) {
      return NextResponse.json({ data: null, error: "Endast PNG eller SVG tillåts" }, { status: 400 });
    }

    await fs.mkdir(PUBLIC_DIR, { recursive: true });

    // Rensa gamla logotyper
    try { await fs.unlink(path.join(PUBLIC_DIR, "custom-logo.png")); } catch (e) {}
    try { await fs.unlink(path.join(PUBLIC_DIR, "custom-logo.svg")); } catch (e) {}

    const ext = isPng ? "png" : "svg";
    const filePath = path.join(PUBLIC_DIR, `custom-logo.${ext}`);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Busta cachen genom att skicka tidsstämpel till frontend
    return NextResponse.json({ data: { path: `/custom-logo.${ext}?v=${Date.now()}` }, error: null }, { status: 200 });
  } catch (error) {
    console.error("Fel vid uppladdning:", error);
    return NextResponse.json({ data: null, error: "Serverfel vid sparande" }, { status: 500 });
  }
}
