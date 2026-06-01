import type { ForecastHour, Spot } from "../types";

const COMPASS_16 = [
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

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfCurrentHour(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d;
}

function pickFromBias(rand: () => number, options: string[], spread = 2): string {
  if (options.length === 0) return COMPASS_16[Math.floor(rand() * COMPASS_16.length)];
  const base = options[Math.floor(rand() * options.length)];
  const idx = COMPASS_16.indexOf(base);
  if (idx === -1) return base;
  const drift = Math.floor(rand() * (spread * 2 + 1)) - spread;
  return COMPASS_16[(idx + drift + COMPASS_16.length) % COMPASS_16.length];
}

export function generateMockForecast(spot: Spot, hours = 48): ForecastHour[] {
  const seed = hashString(spot.id);
  const rand = mulberry32(seed);
  const start = startOfCurrentHour();
  const out: ForecastHour[] = [];

  const idealLow = spot.idealWindMph[0];
  const idealHigh = spot.idealWindMph[1];
  const idealMid = (idealLow + idealHigh) / 2;

  let lastSpeed = idealMid - 4 + rand() * 8;

  for (let i = 0; i < hours; i++) {
    const time = new Date(start.getTime() + i * 3600 * 1000);

    const dayPhase = Math.sin(((time.getHours() - 6) / 24) * Math.PI * 2);
    const swing = (rand() - 0.5) * 6;
    const targetSpeed = idealMid + dayPhase * 5 + swing;
    lastSpeed = lastSpeed * 0.6 + targetSpeed * 0.4;
    const windSpeedMph = Math.max(0, Math.round(lastSpeed * 10) / 10);

    const gustExtra = 2 + rand() * 8;
    const windGustMph = Math.round((windSpeedMph + gustExtra) * 10) / 10;

    let directionPool: string[];
    const directionRoll = rand();
    if (directionRoll < 0.65 && spot.idealWindDirections.length) {
      directionPool = spot.idealWindDirections;
    } else if (directionRoll < 0.85 && spot.unsafeWindDirections.length) {
      directionPool = spot.unsafeWindDirections;
    } else {
      directionPool = COMPASS_16;
    }
    const windDirection = pickFromBias(rand, directionPool, 2);

    const temperatureF = Math.round(72 + dayPhase * 12 + (rand() - 0.5) * 4);
    const rainChance = Math.round(Math.max(0, Math.min(1, rand() * 0.7 - 0.1)) * 100) / 100;
    const waveHeightFt = Math.round((1 + windSpeedMph * 0.08 + (rand() - 0.5) * 0.6) * 10) / 10;

    const tideCycle = ((i + Math.floor(seed % 6)) % 12) / 12;
    const tide: ForecastHour["tide"] =
      tideCycle < 0.25 ? "rising" : tideCycle < 0.5 ? "high" : tideCycle < 0.75 ? "falling" : "low";

    out.push({
      time: time.toISOString(),
      windSpeedMph,
      windGustMph,
      windDirection,
      temperatureF,
      rainChance,
      waveHeightFt,
      tide,
    });
  }

  return out;
}
