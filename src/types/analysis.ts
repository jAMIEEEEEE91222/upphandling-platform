export type FlagLevel = "NORMAL" | "WARNING" | "CRITICAL";

export interface AnalysisResult {
  id: string;
  procurementId: string;
  analyzedAt: string;
  totalItems: number;
  totalBids: number;
  flaggedItems: number;
  avgZScore: number | null;
  maxZScore: number | null;
}

export interface ItemStatistic {
  id: string;
  analysisResultId: string;
  itemName: string;
  meanPrice: string; // Decimal serialiseras som string
  medianPrice: string;
  stdDev: string;
  minPrice: string;
  maxPrice: string;
  priceRange: string;
  sampleSize: number;
  hasMissingPrices: boolean;
  hasZeroPrices: boolean;
  suspectedCollusion: boolean;
}

export interface FlagResult {
  id: string;
  lineItemId: string;
  itemStatisticId: string;
  zScore: number;
  flagLevel: FlagLevel;
  flagReason: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
}

export interface Report {
  id: string;
  procurementId: string;
  generatedAt: string;
  filePath: string;
  fileSize: number | null;
}
