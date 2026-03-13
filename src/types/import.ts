export interface RawExcelData {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface ColumnMapping {
  itemName: string | null;
  price: string | null;
  unit: string | null;
  itemCode: string | null;
  supplierName: string | null;
}

export interface ParsedLineItem {
  itemName: string;
  itemCode?: string;
  unit?: string;
  price: number | null;
  priceNote?: string;
  supplierName: string;
}
