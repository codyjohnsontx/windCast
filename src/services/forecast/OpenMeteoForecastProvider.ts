import type { ForecastHour, Spot } from "../../types";
import { ForecastError, type ForecastProvider } from "./types";
// import { degreesToCompass, mpsToMph, celsiusToFahrenheit } from "./normalize";

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

  async getHourlyForecast(_spot: Spot, _hours = 48): Promise<ForecastHour[]> {
    throw new ForecastError(
      "OpenMeteoForecastProvider is not implemented yet. See file for integration notes.",
      this.id
    );
  }
}
