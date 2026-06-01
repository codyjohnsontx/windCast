import type { ForecastHour, Spot } from "../../types";

export interface ForecastProvider {
  readonly id: string;
  getHourlyForecast(spot: Spot, hours?: number): Promise<ForecastHour[]>;
}

export class ForecastError extends Error {
  public readonly providerId: string;
  public readonly cause?: unknown;

  constructor(message: string, providerId: string, cause?: unknown) {
    super(message);
    this.name = "ForecastError";
    this.providerId = providerId;
    this.cause = cause;
  }
}
