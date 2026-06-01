import type { ForecastHour, Spot } from "../../types";
import type { ForecastProvider } from "./types";

type CacheEntry = {
  expiresAt: number;
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

  async getHourlyForecast(spot: Spot, hours = 48): Promise<ForecastHour[]> {
    const key = this.cacheKey(spot, hours);
    const cached = this.readCache(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    const fresh = await this.inner.getHourlyForecast(spot, hours);
    this.writeCache(key, { expiresAt: Date.now() + this.ttlMs, data: fresh });
    return fresh;
  }

  private cacheKey(spot: Spot, hours: number): string {
    return `windcast.forecast.${this.inner.id}.${spot.id}.${hours}`;
  }

  private readCache(key: string): CacheEntry | null {
    try {
      const raw = this.storage.getItem(key);
      return raw ? (JSON.parse(raw) as CacheEntry) : null;
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
