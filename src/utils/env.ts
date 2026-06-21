export function parseTimeoutMs(value: unknown, fallbackMs: number): number {
  const parsed = Number(value ?? fallbackMs);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
}
