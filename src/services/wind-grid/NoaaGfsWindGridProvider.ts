import { WindGridError, type WindGridDataset, type WindGridProvider } from "./types";
import { parseTimeoutMs } from "../../utils/env";

const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

/**
 * NOAA GFS wind grid provider stub.
 *
 * Real path:
 *   - Source: NOAA NOMADS GFS 0.25° at the surface (10 m wind, UGRD + VGRD).
 *     https://nomads.ncep.noaa.gov/dods/gfs_0p25
 *   - Format: GRIB2 — browsers cannot decode it. The standard production
 *     setup is a small serverless proxy (Cloudflare Worker / Vercel Edge /
 *     AWS Lambda) that:
 *       1. fetches the latest GFS cycle
 *       2. decodes GRIB2 via `wgrib2` or a Node port
 *       3. emits leaflet-velocity JSON: [{header, data}, {header, data}]
 *       4. caches per cycle (forecasts publish every 6 hours)
 *   - Bbox + level: pass the user's current map bounds and the 10 m level so
 *     the payload is small enough for mobile.
 *
 * Alternatives (different tradeoffs, not particle animation):
 *   - OpenWeatherMap wind raster tiles: simpler overlay, no particle flow.
 *     https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=KEY
 *   - Stormglass marine API: per-point only; would need to interpolate.
 *
 * To enable this provider once the proxy exists:
 *   1. Implement getWindGrid() to fetch from VITE_WIND_GRID_PROXY_URL.
 *   2. Set VITE_WIND_GRID_PROVIDER=noaa-gfs in .env.local.
 */
export class NoaaGfsWindGridProvider implements WindGridProvider {
  readonly id = "noaa-gfs";

  async getWindGrid(): Promise<WindGridDataset> {
    const proxyUrl = import.meta.env.VITE_WIND_GRID_PROXY_URL;
    if (!proxyUrl) {
      throw new WindGridError(
        "NOAA GFS wind grid needs VITE_WIND_GRID_PROXY_URL. See file for integration notes.",
        this.id
      );
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs());
    try {
      const response = await fetch(proxyUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`NOAA GFS proxy returned ${response.status}`);
      }
      const payload = await response.json();
      if (!isWindGridDataset(payload)) {
        throw new Error("NOAA GFS proxy returned an invalid wind grid payload");
      }
      return payload;
    } catch (error) {
      throw new WindGridError("Could not load NOAA GFS wind grid.", this.id, error);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

function requestTimeoutMs(): number {
  return parseTimeoutMs(import.meta.env.VITE_WIND_GRID_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS);
}

function isWindGridDataset(value: unknown): value is WindGridDataset {
  if (!Array.isArray(value) || value.length !== 2) return false;
  return value.every((grid) => {
    if (!grid || typeof grid !== "object") return false;
    const candidate = grid as Partial<WindGridDataset[number]>;
    return Boolean(candidate.header) && Array.isArray(candidate.data);
  });
}
