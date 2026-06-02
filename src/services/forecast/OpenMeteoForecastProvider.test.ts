import { afterEach, describe, expect, it, vi } from "vitest";
import type { Spot } from "../../types";
import { OpenMeteoForecastProvider } from "./OpenMeteoForecastProvider";
import { ForecastError } from "./types";

const spot: Spot = {
  id: "test",
  name: "Test",
  latitude: 27,
  longitude: -97,
  sportTypes: [],
  idealWindDirections: [],
  unsafeWindDirections: [],
  minWindMph: 0,
  idealWindMph: [0, 100],
  maxWindMph: 100,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("OpenMeteoForecastProvider", () => {
  it("rejects invalid forecast hour counts before fetching", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(new OpenMeteoForecastProvider().getHourlyForecast(spot, 0)).rejects.toThrow(
      RangeError
    );
    await expect(new OpenMeteoForecastProvider().getHourlyForecast(spot, 1.5)).rejects.toThrow(
      RangeError
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps Open-Meteo hourly data to ForecastHour", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          utc_offset_seconds: -18000,
          hourly: {
            time: ["2026-06-01T13:00", "2026-06-01T12:00"],
            wind_speed_10m: [10, 5],
            wind_gusts_10m: [12, 7],
            wind_direction_10m: [135, 0],
            precipitation_probability: [60, 20],
            temperature_2m: [20, 10],
          },
        }),
      })
    );

    const data = await new OpenMeteoForecastProvider().getHourlyForecast(spot, 2);

    expect(data).toHaveLength(2);
    expect(data[0].time).toBe("2026-06-01T17:00:00.000Z");
    expect(data[0]).toMatchObject({
      windDirection: "N",
      rainChance: 0.2,
      temperatureF: 50,
    });
    expect(data[0].windSpeedMph).toBeCloseTo(11.2, 1);
    expect(data[1].windDirection).toBe("SE");
  });

  it("throws ForecastError on failed requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(new OpenMeteoForecastProvider().getHourlyForecast(spot, 1)).rejects.toBeInstanceOf(ForecastError);
  });

  it("throws ForecastError when utc_offset_seconds is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          hourly: {
            time: ["2026-06-01T12:00"],
            wind_speed_10m: [5],
            wind_gusts_10m: [7],
            wind_direction_10m: [0],
          },
        }),
      })
    );

    await expect(new OpenMeteoForecastProvider().getHourlyForecast(spot, 1)).rejects.toBeInstanceOf(ForecastError);
  });
});
