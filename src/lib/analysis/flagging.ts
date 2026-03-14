export const FLAG_THRESHOLDS = { WARNING: 1.5, CRITICAL: 2.5 } as const;

export type FlagLevel = "NORMAL" | "WARNING" | "CRITICAL";

export function determineFlagLevel(
  zScore: number,
  isZeroPrice: boolean,
  isCollusion: boolean
): FlagLevel {
  // AFFÄRSREGEL: Nollpris är alltid CRITICAL
  if (isZeroPrice) return "CRITICAL";

  // AFFÄRSREGEL: Identiska priser hos alla leverantörer flaggas som WARNING
  // (z-score är 0 när alla priser är identiska, men det ska ändå flaggas)
  if (isCollusion) return "WARNING";

  const absZ = Math.abs(zScore);
  if (absZ >= FLAG_THRESHOLDS.CRITICAL) return "CRITICAL";
  if (absZ >= FLAG_THRESHOLDS.WARNING) return "WARNING";
  return "NORMAL";
}

export function detectCollusion(prices: number[]): boolean {
  // AFFÄRSREGEL: Alla identiska priser (min 2 leverantörer) = misstänkt samordning
  if (prices.length < 2) return false;
  // Filtrera bort nollpriser – samordning avser bara faktiska priser
  const nonZeroPrices = prices.filter(p => p > 0);
  if (nonZeroPrices.length < 2) return false;
  const uniquePrices = new Set(nonZeroPrices.map(p => p.toFixed(4)));
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

export function getFlagClassName(flagLevel: "NORMAL" | "WARNING" | "CRITICAL" | null): string {
  const map = {
    NORMAL:   "bg-green-50 text-green-700",
    WARNING:  "bg-amber-50 text-amber-700",
    CRITICAL: "bg-red-50 text-red-700",
  };
  return flagLevel ? map[flagLevel] : "bg-gray-50 text-gray-400";
}

export function getFlagIcon(flagLevel: "NORMAL" | "WARNING" | "CRITICAL" | null): string {
  const map = {
    NORMAL:   "✓",
    WARNING:  "⚠",
    CRITICAL: "⛔",
  };
  return flagLevel ? map[flagLevel] : "—";
}
