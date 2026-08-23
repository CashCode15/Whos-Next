export function qualityFromStats(rttMs: number, loss: number) {
  if (rttMs < 120 && loss < 0.01) return "excellent" as const;
  if (rttMs < 260 && loss < 0.04) return "good" as const;
  return "poor" as const;
}
