import ExcelJS from "exceljs";
import type { ReportData } from "@/types/report";

export async function generateExcelReport(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Upphandlingsanalysplattformen";
  workbook.created = new Date();

  // Flik 1: Avvikelsematris
  const matrixSheet = workbook.addWorksheet("Avvikelsematris");
  
  const matrixHeaders = ["Artikelnamn", "Art.nr", "Enhet", "Flaggstatus", ...data.suppliers];
  matrixSheet.addRow(matrixHeaders);
  
  const headerRow = matrixSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

  data.items.forEach(item => {
    const rowData = [
      item.itemName,
      item.itemCode || "",
      item.unit || "",
      item.highestFlagLevel || "NORMAL",
      ...data.suppliers.map(sup => item.cells[sup]?.price ?? null)
    ];
    
    const row = matrixSheet.addRow(rowData);
    
    // Formatera leverantörspris-celler
    data.suppliers.forEach((sup, idx) => {
      const colIndex = 5 + idx; // Leverantörer börjar på kolumn 5
      const cellData = item.cells[sup];
      const cell = row.getCell(colIndex);
      
      if (cellData && cellData.price !== null) {
        cell.numFmt = '#,##0.00 "kr"';
        
        if (cellData.flagLevel === "CRITICAL") {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
          cell.font = { color: { argb: 'FFDC2626' } };
        } else if (cellData.flagLevel === "WARNING") {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
          cell.font = { color: { argb: 'FFD97706' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
          cell.font = { color: { argb: 'FF16A34A' } };
        }
      } else {
         cell.font = { italic: true, color: { argb: 'FF9CA3AF'} };
      }
    });
  });

  matrixSheet.columns.forEach(column => {
    column.width = 15;
  });
  matrixSheet.getColumn(1).width = 40; // Artikelnamn

  // Flik 2: Flaggade artiklar
  const flaggedSheet = workbook.addWorksheet("Flaggade artiklar");
  flaggedSheet.addRow(["Artikelnamn", "Leverantör", "Pris", "Z-score", "Nivå", "Anledning", "Handläggarnotering"]);
  flaggedSheet.getRow(1).font = { bold: true };
  flaggedSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

  data.items.forEach(item => {
    data.suppliers.forEach(sup => {
      const cell = item.cells[sup];
      if (cell && (cell.flagLevel === "WARNING" || cell.flagLevel === "CRITICAL")) {
        const row = flaggedSheet.addRow([
          item.itemName,
          sup,
          cell.price,
          cell.zScore,
          cell.flagLevel,
          cell.flagReason || "",
          cell.reviewNote || ""
        ]);
        
        row.getCell(3).numFmt = '#,##0.00 "kr"';
        row.getCell(4).numFmt = '0.00';
        
        // Färgkoda rad baserat på flagLevel
        const argbBg = cell.flagLevel === "CRITICAL" ? 'FFFEF2F2' : 'FFFFFBEB';
        const argbText = cell.flagLevel === "CRITICAL" ? 'FFDC2626' : 'FFD97706';
        
        row.eachCell(c => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbBg } };
          c.font = { color: { argb: argbText } };
        });
      }
    });
  });

  flaggedSheet.getColumn(1).width = 40;
  flaggedSheet.getColumn(2).width = 25;
  flaggedSheet.getColumn(6).width = 40;
  flaggedSheet.getColumn(7).width = 40;

  // Flik 3: Statistik
  const statSheet = workbook.addWorksheet("Statistik");
  statSheet.addRow(["Artikelnamn", "Medelpris", "Medianpris", "Std.avvikelse", "Minpris", "Maxpris", "Antal Priser", "Misstänkt Samordning", "Nollpriser existerar"]);
  statSheet.getRow(1).font = { bold: true };
  statSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

  data.items.forEach(item => {
    const stat = item.stats;
    const row = statSheet.addRow([
      item.itemName,
      stat.mean,
      stat.median,
      stat.stdDev,
      stat.min,
      stat.max,
      stat.sampleSize,
      stat.suspectedCollusion ? "Ja" : "Nej",
      stat.hasZeroPrices ? "Ja" : "Nej"
    ]);
    
    [2, 3, 4, 5, 6].forEach(colIdx => {
      row.getCell(colIdx).numFmt = '#,##0.00 "kr"';
    });
  });

  statSheet.getColumn(1).width = 40;
  for(let i = 2; i <= 9; i++) statSheet.getColumn(i).width = 18;

  // Bygg filbuffert
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
