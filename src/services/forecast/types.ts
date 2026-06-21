import type { ForecastHour, Spot } from "../../types";

export type ProviderStatus = "ready" | "loading" | "degraded" | "offline";

export type ForecastSourceMeta = {
  source: string;
  providerId: string;
  status: Exclude<ProviderStatus, "loading">;
  fetchedAt: string;
  expiresAt?: string;
  isFallback: boolean;
  message?: string;
};

export type ForecastResult = {
  hours: ForecastHour[];
  meta: ForecastSourceMeta;
};

export interface ForecastProvider {
  readonly id: string;
  getHourlyForecast(spot: Spot, hours?: number): Promise<ForecastHour[]>;
  getHourlyForecastResult?(spot: Spot, hours?: number): Promise<ForecastResult>;
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
