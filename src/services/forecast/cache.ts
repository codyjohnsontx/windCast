import type { ForecastHour, Spot } from "../../types";
import type { ForecastProvider, ForecastRequestOptions, ForecastResult } from "./types";

type CacheEntry = {
  expiresAt: number;
  fetchedAt: number;
  data: ForecastHour[];
};

/**
 * Wraps another ForecastProvider with a localStorage-backed TTL cache.
 * Unused by the MVP — provided so real providers (Open-Meteo, Stormglass, NOAA)
 * can compose with caching without rewriting consumers:
 *
 *   const provider = new CachedForecastProvider(
 *     new OpenMeteoForecastProvider(),
 *     30 * 60 * 1000
 *   );
 */
export class CachedForecastProvider implements ForecastProvider {
  readonly id: string;

  constructor(
    private readonly inner: ForecastProvider,
    private readonly ttlMs: number,
    private readonly storage: Storage = typeof window !== "undefined" ? window.localStorage : memoryStorage()
  ) {
    this.id = `${inner.id}+cache`;
  }

  async getHourlyForecast(spot: Spot, hours = 48, options?: ForecastRequestOptions): Promise<ForecastHour[]> {
    return (await this.getHourlyForecastResult(spot, hours, options)).hours;
  }

  async getHourlyForecastResult(spot: Spot, hours = 48, options?: ForecastRequestOptions): Promise<ForecastResult> {
    const key = this.cacheKey(spot, hours);
    const cached = this.readCache(key);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        hours: cached.data,
        meta: {
          source: "cache",
          providerId: this.inner.id,
          status: "ready",
          fetchedAt: new Date(cached.fetchedAt).toISOString(),
          expiresAt: new Date(cached.expiresAt).toISOString(),
          isFallback: false,
          message: "Using cached forecast",
        },
      };
    }

    try {
      const fresh = await this.inner.getHourlyForecast(spot, hours, options);
      const fetchedAt = Date.now();
      const expiresAt = fetchedAt + this.ttlMs;
      this.writeCache(key, { expiresAt, fetchedAt, data: fresh });
      return {
        hours: fresh,
        meta: {
          source: this.inner.id,
          providerId: this.inner.id,
          status: "ready",
          fetchedAt: new Date(fetchedAt).toISOString(),
          expiresAt: new Date(expiresAt).toISOString(),
          isFallback: false,
        },
      };
    } catch (error) {
      if (cached) {
        return {
          hours: cached.data,
          meta: {
            source: "stale cache",
            providerId: this.inner.id,
            status: "degraded",
            fetchedAt: new Date(cached.fetchedAt).toISOString(),
            expiresAt: new Date(cached.expiresAt).toISOString(),
            isFallback: true,
            message: "Live forecast failed; showing the last cached forecast",
          },
        };
      }
      throw error;
    }
  }

  private cacheKey(spot: Spot, hours: number): string {
    return `windcast.forecast.${this.inner.id}.${spot.id}.${spot.latitude.toFixed(4)}.${spot.longitude.toFixed(4)}.${hours}`;
  }

  private readCache(key: string): CacheEntry | null {
    try {
      const raw = this.storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CacheEntry>;
      const expiresAt = parsed.expiresAt;
      if (!Array.isArray(parsed.data) || typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
        return null;
      }
      const parsedFetchedAt = parsed.fetchedAt;
      const fetchedAt = typeof parsedFetchedAt === "number" && Number.isFinite(parsedFetchedAt)
        ? parsedFetchedAt
        : expiresAt - this.ttlMs;
      if (!Number.isFinite(fetchedAt)) return null;
      return {
        data: parsed.data,
        expiresAt,
        fetchedAt,
      };
    } catch {
      return null;
    }
  }

  private writeCache(key: string, entry: CacheEntry): void {
    try {
      this.storage.setItem(key, JSON.stringify(entry));
    } catch {
      // Storage may be full or disabled; silently degrade to no-cache.
    }
  }
}

export function clearForecastCache(
  storage: Storage | null = typeof window !== "undefined" ? window.localStorage : null
): void {
  if (!storage) return;
  const prefix = "windcast.forecast.";
  try {
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) storage.removeItem(key);
    }
  } catch {
    // Storage may be disabled; cache clearing is best effort.
  }
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}
