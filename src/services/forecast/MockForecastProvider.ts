import type { ForecastHour, Spot } from "../../types";
import { generateMockForecast } from "../../data/mockForecast";
import type { ForecastProvider, ForecastRequestOptions } from "./types";

export class MockForecastProvider implements ForecastProvider {
  readonly id = "mock";

  async getHourlyForecast(
    spot: Spot,
    hours = 48,
    _options?: ForecastRequestOptions
  ): Promise<ForecastHour[]> {
    return Promise.resolve(generateMockForecast(spot, hours));
  }
}
