import { MockForecastProvider } from "./MockForecastProvider";
import { OpenMeteoForecastProvider } from "./OpenMeteoForecastProvider";
import { CachedForecastProvider } from "./cache";
import type { ForecastProvider, ForecastResult } from "./types";
import type { Spot } from "../../types";

export { ForecastError } from "./types";
export { clearForecastCache } from "./cache";
export type { ForecastProvider, ForecastResult, ForecastSourceMeta, ProviderStatus } from "./types";

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

export async function getHourlyForecastResult(spot: Spot, hours = 48): Promise<ForecastResult> {
  const provider = getForecastProvider();
  try {
    if (provider.getHourlyForecastResult) {
      return await provider.getHourlyForecastResult(spot, hours);
    }
    const data = await provider.getHourlyForecast(spot, hours);
    return {
      hours: data,
      meta: {
        source: provider.id,
        providerId: provider.id,
        status: "ready",
        fetchedAt: new Date().toISOString(),
        isFallback: false,
      },
    };
  } catch (error) {
    if (provider.id === "mock") throw error;
    const fallback = await new MockForecastProvider().getHourlyForecast(spot, hours);
    return {
      hours: fallback,
      meta: {
        source: "demo fallback",
        providerId: provider.id,
        status: "degraded",
        fetchedAt: new Date().toISOString(),
        isFallback: true,
        message: "Live forecast unavailable; showing demo forecast data",
      },
    };
  }
}

export function forecastCacheTtlMinutes(): number {
  const raw = Number(import.meta.env.VITE_FORECAST_CACHE_TTL_MINUTES ?? 30);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}
