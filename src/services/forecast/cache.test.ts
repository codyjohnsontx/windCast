import { describe, expect, it, vi } from "vitest";
import type { ForecastHour, Spot } from "../../types";
import { CachedForecastProvider } from "./cache";
import type { ForecastProvider } from "./types";

const spot: Spot = {
  id: "test-spot",
  name: "Test Spot",
  latitude: 27,
  longitude: -97,
  sportTypes: [],
  idealWindDirections: [],
  unsafeWindDirections: [],
  minWindMph: 0,
  idealWindMph: [0, 100],
  maxWindMph: 100,
};

const hour: ForecastHour = {
  time: "2026-06-01T12:00:00.000Z",
  windSpeedMph: 18,
  windGustMph: 24,
  windDirection: "SE",
};

describe("CachedForecastProvider", () => {
  it("returns stale cache as degraded fallback when live provider fails", async () => {
    const storage = memoryStorage();
    const staleEntry = {
      expiresAt: Date.now() - 1000,
      fetchedAt: Date.now() - 60_000,
      data: [hour],
    };
    storage.setItem("windcast.forecast.live.test-spot.27.0000.-97.0000.1", JSON.stringify(staleEntry));
    const inner: ForecastProvider = {
      id: "live",
      getHourlyForecast: vi.fn().mockRejectedValue(new Error("offline")),
    };

    const result = await new CachedForecastProvider(inner, 30_000, storage).getHourlyForecastResult(spot, 1);

    expect(result.hours).toEqual([hour]);
    expect(result.meta.status).toBe("degraded");
    expect(result.meta.source).toBe("stale cache");
    expect(result.meta.isFallback).toBe(true);
  });

  it("ignores cache entries with non-finite timestamps", async () => {
    const storage = memoryStorage();
    storage.setItem(
      "windcast.forecast.live.test-spot.27.0000.-97.0000.1",
      `{"expiresAt":1e999,"fetchedAt":1e999,"data":[${JSON.stringify(hour)}]}`
    );
    const inner: ForecastProvider = {
      id: "live",
      getHourlyForecast: vi.fn().mockResolvedValue([hour]),
    };

    const result = await new CachedForecastProvider(inner, 30_000, storage).getHourlyForecastResult(spot, 1);

    expect(result.hours).toEqual([hour]);
    expect(result.meta.source).toBe("live");
    expect(inner.getHourlyForecast).toHaveBeenCalledOnce();
  });

  it("does not return stale cache when the request is already aborted", async () => {
    const storage = memoryStorage();
    const staleEntry = {
      expiresAt: Date.now() - 1000,
      fetchedAt: Date.now() - 60_000,
      data: [hour],
    };
    storage.setItem("windcast.forecast.live.test-spot.27.0000.-97.0000.1", JSON.stringify(staleEntry));
    const controller = new AbortController();
    controller.abort();
    const inner: ForecastProvider = {
      id: "live",
      getHourlyForecast: vi.fn().mockRejectedValue(new Error("offline")),
    };

    await expect(
      new CachedForecastProvider(inner, 30_000, storage).getHourlyForecastResult(spot, 1, {
        signal: controller.signal,
      })
    ).rejects.toThrow();
    expect(inner.getHourlyForecast).not.toHaveBeenCalled();
  });
});

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => map.delete(key),
    setItem: (key, value) => map.set(key, value),
  };
}
