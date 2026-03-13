export interface MatrixCell {
  lineItemId: string;
  price: number | null;
  priceNote?: string | null;
  flagLevel: "NORMAL" | "WARNING" | "CRITICAL" | null;
  flagReason?: string | null;
  zScore?: number | null;
  flagResultId?: string | null;
}

export interface MatrixRow {
  itemName: string;
  itemCode?: string | null;
  unit?: string | null;
  highestFlagLevel: "NORMAL" | "WARNING" | "CRITICAL" | null;
  stats: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    sampleSize: number;
    hasMissingPrices: boolean;
    hasZeroPrices: boolean;
    suspectedCollusion: boolean;
  };
  cells: Record<string, MatrixCell>; // supplierName → cell
}

export interface DeviationMatrixData {
  suppliers: string[];
  rows: MatrixRow[];
  summary: {
    totalItems: number;
    totalBids: number;
    flaggedItems: number;
    flaggedCritical: number;
    flaggedWarning: number;
    analyzedAt: string;
  };
}
