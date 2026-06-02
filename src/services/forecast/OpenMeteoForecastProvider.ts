import type { ForecastHour, Spot } from "../../types";
import { ForecastError, type ForecastProvider } from "./types";
import { celsiusToFahrenheit, degreesToCompass, mpsToMph } from "./normalize";

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

  async getHourlyForecast(spot: Spot, hours = 48): Promise<ForecastHour[]> {
    const params = new URLSearchParams({
      latitude: String(spot.latitude),
      longitude: String(spot.longitude),
      hourly:
        "wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability,temperature_2m",
      wind_speed_unit: "ms",
      forecast_hours: String(hours),
      timezone: "auto",
    });

    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status}`);
      }

      const payload = (await response.json()) as OpenMeteoResponse;
      const hourly = payload.hourly;
      if (!hourly?.time?.length) {
        throw new Error("Open-Meteo response did not include hourly forecast data");
      }

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
            time: new Date(time).toISOString(),
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
    }
  }
}

type OpenMeteoResponse = {
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
