import { Prisma } from "@prisma/client";

export type ReportData = {
  procurement: {
    id: string;
    title: string;
    category: string;
    referenceNumber: string | null;
  };
  analysis: {
    totalItems: number;
    totalBids: number;
    flaggedItems: number;
    flaggedCritical: number;
    flaggedWarning: number;
    analyzedAt: string;
  };
  suppliers: string[];
  items: Array<{
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
    cells: Record<string, {
      price: number | null;
      flagLevel: "NORMAL" | "WARNING" | "CRITICAL" | null;
      flagReason: string | null;
      zScore: number | null;
      reviewNote?: string | null;
    }>;
  }>;
};
