export const COMPASS_16 = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

export function normalizeDirection(dir: string): string {
  return dir.trim().toUpperCase();
}

export function compassToDegrees(dir: string): number {
  const idx = COMPASS_16.indexOf(normalizeDirection(dir));
  if (idx === -1) return 0;
  return idx * 22.5;
}

export function degreesToCompass(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 22.5) % 16;
  return COMPASS_16[idx];
}

export function isIdealDirection(direction: string, idealDirections: string[]): boolean {
  const d = normalizeDirection(direction);
  return idealDirections.map(normalizeDirection).includes(d);
}

export function isUnsafeDirection(direction: string, unsafeDirections: string[]): boolean {
  const d = normalizeDirection(direction);
  return unsafeDirections.map(normalizeDirection).includes(d);
}
