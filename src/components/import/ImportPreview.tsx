"use client";

import { ColumnMapping } from "@/types/import";

interface ImportPreviewProps {
  rows: Record<string, unknown>[];
  mapping: ColumnMapping;
}

export default function ImportPreview({ rows, mapping }: ImportPreviewProps) {
  const previewRows = rows.slice(0, 10);
  
  const hasMissingPrices = previewRows.some(row => {
    if (!mapping.price) return false;
    const p = row[mapping.price];
    return p === "" || p === null || p === undefined || Number.isNaN(Number(p));
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Förhandsgranskning (första 10 raderna)</h3>
      
      {hasMissingPrices && (
        <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-sm">
          <strong>Varning:</strong> Vissa rader saknar giltigt pris i den valda kolumnen. Dessa kommer att importeras utan pris.
        </div>
      )}

      <div className="rounded-md border overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 border-b">Artikel</th>
              <th className="px-4 py-2 border-b">Art.nr</th>
              <th className="px-4 py-2 border-b">Enhet</th>
              <th className="px-4 py-2 border-b">Pris</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-2">{mapping.itemName ? String(row[mapping.itemName] || "") : "-"}</td>
                <td className="px-4 py-2">{mapping.itemCode ? String(row[mapping.itemCode] || "") : "-"}</td>
                <td className="px-4 py-2">{mapping.unit ? String(row[mapping.unit] || "") : "-"}</td>
                <td className="px-4 py-2 font-mono">{mapping.price ? String(row[mapping.price] || "") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <p className="text-sm text-muted-foreground text-center">... och {rows.length - 10} fler rader</p>
      )}
    </div>
  );
}
