import { MockForecastProvider } from "./MockForecastProvider";
import { OpenMeteoForecastProvider } from "./OpenMeteoForecastProvider";
import type { ForecastProvider } from "./types";

export { ForecastError } from "./types";
export type { ForecastProvider } from "./types";

let cached: ForecastProvider | null = null;

export function getForecastProvider(): ForecastProvider {
  if (cached) return cached;
  const id = (import.meta.env.VITE_FORECAST_PROVIDER ?? "mock").toLowerCase();
  switch (id) {
    case "open-meteo":
      cached = new OpenMeteoForecastProvider();
      break;
    case "mock":
    default:
      cached = new MockForecastProvider();
      break;
  }
  return cached;
}
