import puppeteer from "puppeteer";
import path from "path";
import fs from "fs/promises";

const REPORTS_DIR = path.join(process.cwd(), "reports");

export async function generatePDF(html: string, filename: string): Promise<string> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  
  const filePath = path.join(REPORTS_DIR, filename);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });
    return filePath;
  } finally {
    await browser.close();
  }
}
