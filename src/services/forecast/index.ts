import { MockForecastProvider } from "./MockForecastProvider";
import { OpenMeteoForecastProvider } from "./OpenMeteoForecastProvider";
import { CachedForecastProvider } from "./cache";
import type { ForecastProvider } from "./types";

export { ForecastError } from "./types";
export { clearForecastCache } from "./cache";
export type { ForecastProvider } from "./types";

let cached: ForecastProvider | null = null;

export function getForecastProvider(): ForecastProvider {
  if (cached) return cached;
  const id = (import.meta.env.VITE_FORECAST_PROVIDER ?? "mock").toLowerCase();
  switch (id) {
    case "open-meteo":
      cached = new CachedForecastProvider(
        new OpenMeteoForecastProvider(),
        forecastCacheTtlMinutes() * 60 * 1000
      );
      break;
    case "mock":
    default:
      cached = new MockForecastProvider();
      break;
  }
  return cached;
}

export function forecastCacheTtlMinutes(): number {
  const raw = Number(import.meta.env.VITE_FORECAST_CACHE_TTL_MINUTES ?? 30);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}
