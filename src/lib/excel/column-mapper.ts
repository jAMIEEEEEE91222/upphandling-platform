import { ColumnMapping } from "@/types/import";

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    itemName: null,
    price: null,
    unit: null,
    itemCode: null,
    supplierName: null,
  };

  for (const original of headers) {
    const h = original.toLowerCase().trim();

    // Priority: strict matches first, then partial matches to avoid capturing wrong columns
    if (!mapping.itemName && ["artikel", "benämning", "produkt", "vara", "beskrivning", "name", "item"].some(k => h.includes(k) && !h.includes("nr") && !h.includes("kod"))) {
      mapping.itemName = original;
      continue;
    }
    
    if (!mapping.itemCode && ["art.nr", "artikelnr", "kod", "code", "nr"].some(k => h.includes(k))) {
      mapping.itemCode = original;
      continue;
    }

    if (!mapping.price && ["pris", "belopp", "kostnad", "price", "kr", "sek"].some(k => h.includes(k))) {
      mapping.price = original;
      continue;
    }

    if (!mapping.unit && ["enhet", "unit", "st", "förp"].some(k => h.includes(k))) {
      mapping.unit = original;
      continue;
    }

    if (!mapping.supplierName && ["leverantör", "supplier", "företag", "vendor"].some(k => h.includes(k))) {
      mapping.supplierName = original;
      continue;
    }
  }

  // Fallback if priority match fails
  for (const original of headers) {
    const h = original.toLowerCase().trim();
    if (!mapping.itemName && ["artikel", "benämning", "produkt", "vara", "beskrivning", "name", "item"].some(k => h.includes(k))) {
      mapping.itemName = original;
    }
  }

  return mapping;
}
