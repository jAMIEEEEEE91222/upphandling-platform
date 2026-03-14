import { ReportData } from "@/types/report";
import fs from "fs";
import path from "path";

function getLogoData() {
  try {
    const pngPath = path.join(process.cwd(), "public", "custom-logo.png");
    if (fs.existsSync(pngPath)) {
      const data = fs.readFileSync(pngPath);
      return `data:image/png;base64,${data.toString("base64")}`;
    }
    const svgPath = path.join(process.cwd(), "public", "custom-logo.svg");
    if (fs.existsSync(svgPath)) {
      const data = fs.readFileSync(svgPath);
      return `data:image/svg+xml;base64,${data.toString("base64")}`;
    }
  } catch (e) {}
  return null;
}

function formatPrice(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(value);
}

export function generateReportHTML(data: ReportData): string {
  const logoData = getLogoData();
  const dateStr = new Intl.DateTimeFormat("sv-SE", { dateStyle: "long", timeStyle: "short" }).format(new Date(data.analysis.analyzedAt));
  
  const generateHeader = (title: string = "") => `
    <div class="header-container">
      ${logoData ? `<img src="${logoData}" alt="Logotyp" class="logo" />` : `<div class="logo-placeholder">Kommun</div>`}
      <div class="header-text">${title}</div>
    </div>
  `;

  const criticalItems = data.items.filter(i => i.highestFlagLevel === "CRITICAL");
  const warningItems = data.items.filter(i => i.highestFlagLevel === "WARNING");
  const hasCollusion = data.items.some(i => i.stats.suspectedCollusion);
  const zeroPriceItems = data.items.filter(i => i.stats.hasZeroPrices);

  return `
    <!DOCTYPE html>
    <html lang="sv">
    <head>
      <meta charset="UTF-8">
      <title>Analysrapport - ${data.procurement.title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 0; }
        body {
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          background: #fff;
          font-size: 11px;
        }
        .page {
          // padding: 20mm 15mm; (handled by puppeteer margins)
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: auto;
        }
        h1 { font-size: 24px; color: #111827; margin-bottom: 24px; font-weight: 700; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        h2 { font-size: 18px; color: #374151; margin-top: 24px; margin-bottom: 12px; font-weight: 600; }
        h3 { font-size: 14px; color: #4b5563; margin-top: 16px; margin-bottom: 8px; font-weight: 600; }
        
        .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; }
        .logo { max-height: 40px; max-width: 150px; }
        .logo-placeholder { font-size: 18px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
        .header-text { font-size: 12px; color: #6b7280; }
        
        .footer { position: absolute; bottom: 0; left: 0; width: 100%; text-align: center; font-size: 9px; color: #9ca3af; padding-top: 10px; border-top: 1px solid #e5e7eb; }
        
        .cover-title { font-size: 36px; font-weight: 800; color: #111827; margin: 60px 0 20px 0; line-height: 1.2; }
        .cover-subtitle { font-size: 18px; color: #4b5563; margin-bottom: 60px; font-weight: 500; }
        
        .metadata-table { width: 100%; max-width: 500px; border-collapse: collapse; margin-bottom: 40px; }
        .metadata-table th, .metadata-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .metadata-table th { font-weight: 600; color: #4b5563; width: 40%; }
        .metadata-table td { font-weight: 500; color: #111827; }
        
        .metric-cards { display: flex; gap: 16px; margin-bottom: 32px; }
        .card { flex: 1; padding: 16px; border-radius: 6px; text-align: center; }
        .card-red { background-color: #fef2f2; border: 1px solid #fecaca; }
        .card-amber { background-color: #fffbeb; border: 1px solid #fde68a; }
        .card-green { background-color: #f0fdf4; border: 1px solid #bbf7d0; }
        .card-value { font-size: 32px; font-weight: 700; margin: 8px 0; }
        .card-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .card-red .card-value, .card-red .card-label { color: #dc2626; }
        .card-amber .card-value, .card-amber .card-label { color: #d97706; }
        .card-green .card-value, .card-green .card-label { color: #16a34a; }
        
        .alert-banner { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-weight: 500; display: flex; align-items: center; }
        .alert-banner-red { background-color: #fef2f2; color: #991b1b; border-left: 4px solid #dc2626; }
        .alert-banner-amber { background-color: #fffbeb; color: #92400e; border-left: 4px solid #d97706; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 10px; }
        th, td { padding: 8px 8px; border: 1px solid #e5e7eb; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
        
        .item-section { margin-bottom: 32px; page-break-inside: avoid; border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; }
        .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
        .item-title { font-size: 14px; font-weight: 700; color: #111827; margin: 0; }
        .item-meta { font-size: 11px; color: #6b7280; }
        
        .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
        .stat-box { background: #f3f4f6; padding: 8px; border-radius: 4px; text-align: center; }
        .stat-label { font-size: 8px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
        .stat-value { font-size: 11px; font-weight: 700; color: #111827; }
        
        .bg-red { background-color: #fef2f2 !important; color: #991b1b !important; }
        .bg-amber { background-color: #fffbeb !important; color: #92400e !important; }
        .bg-green { background-color: #ffffff !important; color: #374151 !important; }
        .bg-gray-italic { color: #9ca3af !important; font-style: italic; }
        
        .review-note { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin-top: 12px; border-radius: 0 4px 4px 0; }
        .review-note-title { font-size: 10px; font-weight: 600; color: #1e40af; margin-bottom: 4px; text-transform: uppercase; }
        .review-note-content { font-size: 11px; color: #1e3a8a; margin: 0; }
        
        .appendix-section { margin-bottom: 24px; }
      </style>
    </head>
    <body>
    
      <!-- Försättsblad -->
      <div class="page cover-page">
        ${generateHeader("")}
        <div class="cover-subtitle">Analysrapport – Offentlig Upphandling</div>
        <h1 class="cover-title">${data.procurement.title}</h1>
        
        <table class="metadata-table">
          <tr><th>Upphandling</th><td>${data.procurement.title}</td></tr>
          <tr><th>Kategori</th><td>${data.procurement.category}</td></tr>
          <tr><th>Referensnummer</th><td>${data.procurement.referenceNumber || "—"}</td></tr>
          <tr><th>Analyserat</th><td>${dateStr}</td></tr>
          <tr><th>Antal leverantörer</th><td>${data.analysis.totalBids} st</td></tr>
          <tr><th>Antal artiklar</th><td>${data.analysis.totalItems} st</td></tr>
          <tr><th>Flaggade artiklar</th><td>${data.analysis.flaggedItems} st (${data.analysis.totalItems > 0 ? Math.round((data.analysis.flaggedItems / data.analysis.totalItems) * 100) : 0}%)</td></tr>
        </table>
      </div>
      
      <!-- Sammanfattning -->
      <div class="page">
        ${generateHeader("Sammanfattning")}
        <h1>Sammanfattning</h1>
        
        <div class="metric-cards">
          <div class="card card-red">
            <div class="card-label">Kritiska avvikelser</div>
            <div class="card-value">${data.analysis.flaggedCritical}</div>
          </div>
          <div class="card card-amber">
            <div class="card-label">Varningar</div>
            <div class="card-value">${data.analysis.flaggedWarning}</div>
          </div>
          <div class="card card-green">
            <div class="card-label">Normala artiklar</div>
            <div class="card-value">${data.analysis.totalItems - data.analysis.flaggedItems}</div>
          </div>
        </div>
        
        ${hasCollusion ? `
          <div class="alert-banner alert-banner-red">
            ⚠ Misstänkt prissamordning detekterad – se detaljerad prisanalys för artiklarna.
          </div>
        ` : ''}
        
        ${zeroPriceItems.length > 0 ? `
          <div class="alert-banner alert-banner-amber">
            ℹ ${zeroPriceItems.length} artikel/artiklar innehåller ett eller flera nollpriser.
          </div>
        ` : ''}
        
        <h2>Riskindikatorer (Kritiska avvikelser)</h2>
        ${criticalItems.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Artikel</th>
                <th>Leverantör</th>
                <th>Pris</th>
                <th>Z-score</th>
                <th>Anledning</th>
              </tr>
            </thead>
            <tbody>
              ${criticalItems.map(item => {
                const flaggedCells = Object.entries(item.cells).filter(([, cell]) => cell.flagLevel === "CRITICAL");
                return flaggedCells.map(([supplierName, cell]) => `
                  <tr>
                    <td>${item.itemName}</td>
                    <td>${supplierName}</td>
                    <td>${formatPrice(cell.price)}</td>
                    <td>${cell.zScore !== null ? cell.zScore.toFixed(2) : "—"}</td>
                    <td>${cell.flagReason || "—"}</td>
                  </tr>
                `).join("");
              }).join("")}
            </tbody>
          </table>
        ` : `<p>Inga kritiska avvikelser upptäcktes i denna upphandling.</p>`}
      </div>
      
      <!-- Detaljerad prisanalys -->
      <div class="page">
        ${generateHeader("Detaljerad Prisanalys")}
        <h1>Detaljerad Prisanalys</h1>
        
        ${data.items.length === 0 ? `<p>Inga artiklar att visa.</p>` : ''}
        
        ${data.items.map((item, index) => {
          
          let pageBreakStart = "";
          if (index > 0 && index % 4 === 0) {
            pageBreakStart = `</div><div class="page">${generateHeader("Detaljerad Prisanalys (forts.)")}`;
          }

          // Gather review notes specifically for this item (deduplicated or just merged)
          const notes = Object.entries(item.cells)
            .filter(([, cell]) => cell.reviewNote)
            .map(([sup, cell]) => `<strong>${sup}:</strong> ${cell.reviewNote}`)
            .join("<br/>");

          return `
            ${pageBreakStart}
            <div class="item-section">
              <div class="item-header">
                <h3 class="item-title">${item.itemName}</h3>
                <div class="item-meta">
                  ${item.itemCode ? `Art.nr: ${item.itemCode}` : ""} 
                  ${item.unit ? ` | Enhet: ${item.unit}` : ""}
                </div>
              </div>
              
              <div class="stat-grid">
                <div class="stat-box"><div class="stat-label">Medel</div><div class="stat-value">${formatPrice(item.stats.mean)}</div></div>
                <div class="stat-box"><div class="stat-label">Median</div><div class="stat-value">${formatPrice(item.stats.median)}</div></div>
                <div class="stat-box"><div class="stat-label">Std.avv.</div><div class="stat-value">${formatPrice(item.stats.stdDev)}</div></div>
                <div class="stat-box"><div class="stat-label">Min</div><div class="stat-value">${formatPrice(item.stats.min)}</div></div>
                <div class="stat-box"><div class="stat-label">Max</div><div class="stat-value">${formatPrice(item.stats.max)}</div></div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Leverantör</th>
                    <th>Pris</th>
                    <th>Z-score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.suppliers.map(sup => {
                    const cell = item.cells[sup];
                    const bgClass = cell?.flagLevel === "CRITICAL" ? "bg-red" : 
                                    cell?.flagLevel === "WARNING" ? "bg-amber" : 
                                    cell?.price === null ? "bg-gray-italic" : "bg-green";
                                    
                    return `
                      <tr class="${bgClass}">
                        <td>${sup}</td>
                        <td>${cell?.price === null ? "Saknas/—" : formatPrice(cell?.price ?? null)}</td>
                        <td>${cell?.zScore !== null && cell?.zScore !== undefined ? cell.zScore.toFixed(2) : "—"}</td>
                        <td>${cell?.flagReason || (cell?.flagLevel === "NORMAL" ? "Normal" : "—")}</td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
              
              ${notes ? `
                <div class="review-note">
                  <div class="review-note-title">Handläggarnotering</div>
                  <p class="review-note-content">${notes}</p>
                </div>
              ` : ''}
              
            </div>
          `;
        }).join("")}
      </div>
      
      <!-- Bilagor -->
      <div class="page">
        ${generateHeader("Bilagor")}
        <h1>Bilagor</h1>
        
        <div class="appendix-section">
          <h2>Bilaga 1: Analysparametrar</h2>
          <table>
            <tr><th>Z-score varningsgräns</th><td>1.5</td></tr>
            <tr><th>Z-score kritisk gräns</th><td>2.5</td></tr>
            <tr><th>Mått för spridning</th><td>Standardavvikelse (Populationsavvikelse)</td></tr>
          </table>
        </div>
        
        <div class="appendix-section">
          <h2>Bilaga 2: Förklaring av begrepp</h2>
          <p><strong>Z-score:</strong> Ett statistiskt mått som beskriver hur många standardavvikelser ett specifikt värde befinner sig från medelvärdet. Ett z-score över 2.5 (eller under -2.5) indikerar ett extremt värde (Kritisk).</p>
          <p><strong>Standardavvikelse:</strong> Ett mått på hur mycket priserna i ett anbud varierar eller sprider sig från medelvärdet. En låg standardavvikelse indikerar att priserna ligger nära medelvärdet.</p>
          <p><strong>Misstänkt prissamordning:</strong> Om två eller fler leverantörer (och under förutsättning att alla i anbudet) lämnar exakt samma, icke-noll pris för en specifik artikel. Detta flaggas automatiskt av systemet som en varning.</p>
        </div>
      </div>
      
    </body>
    </html>
  `;
}
