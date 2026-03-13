export function calculateMean(prices: number[]): number {
  if (prices.length === 0) return 0;
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

export function calculateMedian(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function calculateStdDev(prices: number[], mean: number): number {
  if (prices.length < 2) return 0;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  return Math.sqrt(variance);
}

export function calculateZScore(price: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (price - mean) / stdDev;
}
