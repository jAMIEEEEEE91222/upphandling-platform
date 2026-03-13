export const FLAG_THRESHOLDS = { WARNING: 1.5, CRITICAL: 2.5 } as const;

export type FlagLevel = "NORMAL" | "WARNING" | "CRITICAL";

export function determineFlagLevel(zScore: number, isZeroPrice: boolean): FlagLevel {
  // AFFÄRSREGEL: Nollpris är alltid CRITICAL
  if (isZeroPrice) return "CRITICAL";
  
  const absZ = Math.abs(zScore);
  if (absZ >= FLAG_THRESHOLDS.CRITICAL) return "CRITICAL";
  if (absZ >= FLAG_THRESHOLDS.WARNING) return "WARNING";
  return "NORMAL";
}

export function detectCollusion(prices: number[]): boolean {
  // AFFÄRSREGEL: Alla identiska priser (min 2 leverantörer) = misstänkt samordning
  if (prices.length < 2) return false;
  const uniquePrices = new Set(prices.map(p => p.toFixed(4)));
  return uniquePrices.size === 1;
}

export function buildFlagReason(
  flagLevel: FlagLevel,
  zScore: number,
  isZeroPrice: boolean,
  isCollusion: boolean
): string | null {
  if (isZeroPrice) return "Nollpris – kräver granskning";
  if (isCollusion) return "Misstänkt prissamordning – identiska priser hos alla leverantörer";
  if (flagLevel === "CRITICAL") return `Extremt avvikande pris (z=${zScore.toFixed(2)})`;
  if (flagLevel === "WARNING") return `Avvikande pris (z=${zScore.toFixed(2)})`;
  return null;
}
