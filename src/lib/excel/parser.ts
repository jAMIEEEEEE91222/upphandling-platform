import * as xlsx from "xlsx";
import { RawExcelData } from "@/types/import";

export function parseExcelFile(buffer: ArrayBuffer | Buffer | Uint8Array): RawExcelData {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows: Record<string, unknown>[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  
  const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = headerRows.length > 0 ? (headerRows[0] as unknown[]).map(String).filter((h) => h.trim() !== "") : [];

  const rows: Record<string, unknown>[] = [];
  rawRows.forEach((row) => {
    // Check if the row is entirely empty
    const isEmpty = Object.values(row).every(v => v === "" || v === undefined || v === null);
    if (!isEmpty) {
      const cleanRow: Record<string, unknown> = {};
      // Ensure we only keep keys that correspond to valid headers (trim whitespace)
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim();
        if (cleanKey !== "") {
          cleanRow[cleanKey] = row[key];
        }
      });
      rows.push(cleanRow);
    }
  });

  return { headers, rows };
}
