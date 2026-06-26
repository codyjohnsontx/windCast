import type { ForecastHour, Spot } from "../../types";
import { ForecastError, type ForecastProvider, type ForecastRequestOptions } from "./types";
import { celsiusToFahrenheit, degreesToCompass, mpsToMph } from "./normalize";
import { parseTimeoutMs } from "../../utils/env";

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Open-Meteo provider stub.
 *
 * To enable: implement getHourlyForecast() and set VITE_FORECAST_PROVIDER=open-meteo.
 *
 * Endpoint:
 *   https://api.open-meteo.com/v1/forecast
 *     ?latitude={spot.latitude}&longitude={spot.longitude}
 *     &hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability,temperature_2m
 *     &wind_speed_unit=ms
 *     &forecast_hours={hours}
 *
 * Marine swell:
 *   https://marine-api.open-meteo.com/v1/marine?latitude=...&longitude=...&hourly=wave_height
 *
 * Mapping:
 *   wind_speed_10m (m/s)       -> mpsToMph
 *   wind_gusts_10m (m/s)       -> mpsToMph
 *   wind_direction_10m (deg)   -> degreesToCompass
 *   temperature_2m (C)         -> celsiusToFahrenheit
 *   precipitation_probability  -> divide by 100
 *   wave_height (m)            -> metersToFeet
 */
export class OpenMeteoForecastProvider implements ForecastProvider {
  readonly id = "open-meteo";

  async getHourlyForecast(
    spot: Spot,
    hours = 48,
    options?: ForecastRequestOptions
  ): Promise<ForecastHour[]> {
    validateHours(hours);

    const params = new URLSearchParams({
      latitude: String(spot.latitude),
      longitude: String(spot.longitude),
      hourly:
        "wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability,temperature_2m",
      wind_speed_unit: "ms",
      forecast_hours: String(hours),
      timezone: "auto",
    });

    const controller = new AbortController();
    const abortFromSignal = () => controller.abort();
    if (options?.signal?.aborted) controller.abort();
    options?.signal?.addEventListener("abort", abortFromSignal, { once: true });
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs());

    try {
      const baseUrl = (import.meta.env.VITE_OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com/v1").replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/forecast?${params}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status}`);
      }

      const payload = (await response.json()) as OpenMeteoResponse;
      const hourly = payload.hourly;
      if (!hourly?.time?.length) {
        throw new Error("Open-Meteo response did not include hourly forecast data");
      }

      const utcOffsetSeconds = validateUtcOffsetSeconds(payload.utc_offset_seconds);
      return hourly.time
        .map((time, index): ForecastHour | null => {
          const windSpeed = hourly.wind_speed_10m?.[index];
          const windGust = hourly.wind_gusts_10m?.[index];
          const windDirection = hourly.wind_direction_10m?.[index];
          if (
            typeof windSpeed !== "number" ||
            typeof windGust !== "number" ||
            typeof windDirection !== "number"
          ) {
            return null;
          }

          const rainChance = hourly.precipitation_probability?.[index];
          const temperature = hourly.temperature_2m?.[index];
          return {
            time: openMeteoLocalTimeToIso(time, utcOffsetSeconds),
            windSpeedMph: round1(mpsToMph(windSpeed)),
            windGustMph: round1(mpsToMph(windGust)),
            windDirection: degreesToCompass(windDirection),
            rainChance: typeof rainChance === "number" ? rainChance / 100 : undefined,
            temperatureF: typeof temperature === "number" ? Math.round(celsiusToFahrenheit(temperature)) : undefined,
          };
        })
        .filter((hour): hour is ForecastHour => hour !== null)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        .slice(0, hours);
    } catch (err) {
      throw new ForecastError("Could not load Open-Meteo forecast.", this.id, err);
    } finally {
      window.clearTimeout(timeoutId);
      options?.signal?.removeEventListener("abort", abortFromSignal);
    }
  }
}

type OpenMeteoResponse = {
  utc_offset_seconds?: number;
  hourly?: {
    time?: string[];
    wind_speed_10m?: number[];
    wind_gusts_10m?: number[];
    wind_direction_10m?: number[];
    precipitation_probability?: number[];
    temperature_2m?: number[];
  };
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function validateHours(hours: number): void {
  if (!Number.isInteger(hours) || !Number.isFinite(hours) || hours <= 0) {
    throw new RangeError("Forecast hours must be a finite integer greater than 0.");
  }
}

function requestTimeoutMs(): number {
  return parseTimeoutMs(import.meta.env.VITE_OPEN_METEO_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS);
}

function validateUtcOffsetSeconds(value: unknown): number {
  const offset = Number(value);
  if (!Number.isFinite(offset)) {
    throw new Error("Open-Meteo response is missing a valid utc_offset_seconds value.");
  }
  return offset;
}

function openMeteoLocalTimeToIso(time: string, utcOffsetSeconds: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match) throw new Error(`Invalid Open-Meteo hourly time: ${time}`);
  const [, year, month, day, hour, minute = "0"] = match;
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );
  return new Date(localAsUtc - utcOffsetSeconds * 1000).toISOString();
}
