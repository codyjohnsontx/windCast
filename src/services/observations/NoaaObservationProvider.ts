import { celsiusToFahrenheit, degreesToCompass, metersToFeet, mpsToMph } from "../forecast/normalize";
import { MockObservationProvider } from "./MockObservationProvider";
import { stationsWithinRadius } from "./distance";
import { NOAA_STATIONS } from "./noaaStations";
import {
  coopsLatestWaterLevelUrl,
  coopsRecentWaterLevelUrl,
  rawObservationUrl,
} from "./providerLinks";
import type {
  ObservationProvider,
  ObservationRequestOptions,
  ObservationStation,
  StationObservation,
} from "./types";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  observation: StationObservation | null;
};

export class NoaaObservationProvider implements ObservationProvider {
  readonly id = "ndbc";
  private readonly cache = new Map<string, CacheEntry>();
  private readonly manualProvider = new MockObservationProvider();

  async getStationsNear(
    latitude: number,
    longitude: number,
    radiusMiles: number,
    options?: ObservationRequestOptions
  ): Promise<ObservationStation[]> {
    throwIfAborted(options?.signal);
    return stationsWithinRadius(NOAA_STATIONS, latitude, longitude, radiusMiles);
  }

  async getLatestObservation(
    station: ObservationStation,
    options?: ObservationRequestOptions
  ): Promise<StationObservation | null> {
    throwIfAborted(options?.signal);
    const cached = this.cache.get(station.id);
    if (cached && cached.expiresAt > Date.now()) return cached.observation;

    let observation: StationObservation | null = null;
    try {
      if (station.provider === "ndbc") {
        const response = await fetch(rawObservationUrl("ndbc", station.id)!, { signal: options?.signal });
        if (!response.ok) throw new Error(`NDBC returned ${response.status}`);
        observation = parseNdbcLatestObservation(station, await response.text());
      } else if (station.provider === "coops") {
        const latestResponse = await fetch(coopsLatestWaterLevelUrl(station.id), {
          signal: options?.signal,
        });
        if (!latestResponse.ok) throw new Error(`CO-OPS returned ${latestResponse.status}`);
        let recentPayload: CoopsWaterLevelResponse | null = null;
        try {
          const recentResponse = await fetch(coopsRecentWaterLevelUrl(station.id), {
            signal: options?.signal,
          });
          if (recentResponse.ok) {
            recentPayload = (await recentResponse.json()) as CoopsWaterLevelResponse;
          }
        } catch {
          recentPayload = null;
        }
        throwIfAborted(options?.signal);
        observation = parseCoopsLatestObservation(
          station,
          (await latestResponse.json()) as CoopsWaterLevelResponse,
          recentPayload
        );
      } else {
        observation = await this.manualProvider.getLatestObservation(station, options);
      }
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error("Failed to load NOAA observation.", {
        stationId: station.id,
        provider: station.provider,
        error,
      });
      observation = null;
    }

    if (observation) {
      this.cache.set(station.id, { observation, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return observation;
  }
}

export function parseNdbcLatestObservation(
  station: ObservationStation,
  text: string,
  fetchedAt = new Date().toISOString()
): StationObservation | null {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const header = rows.find((line) => line.startsWith("#YY") || line.startsWith("#yr"));
  const data = rows.find((line) => !line.startsWith("#"));
  if (!header || !data) return null;

  const columns = header.replace(/^#/, "").trim().split(/\s+/);
  const values = data.split(/\s+/);
  const get = (name: string) => {
    const index = columns.findIndex((column) => column.toUpperCase() === name.toUpperCase());
    return index >= 0 ? values[index] : undefined;
  };
  const number = (name: string) => parseOptionalNumber(get(name));
  const observedAt = ndbcObservedAt(values[0], values[1], values[2], values[3], values[4]);
  if (!observedAt) return null;

  const windSpeedMps = number("WSPD");
  const windGustMps = number("GST");
  const windDirectionDegrees = number("WDIR");
  const waveHeightMeters = number("WVHT");
  const wavePeriodSeconds = number("DPD") ?? number("APD");
  const airTemperatureC = number("ATMP");
  const waterTemperatureC = number("WTMP");

  return {
    stationId: station.id,
    source: "ndbc",
    rawUrl: rawObservationUrl("ndbc", station.id),
    fetchedAt,
    observedAt,
    windSpeedMph: windSpeedMps !== undefined ? round1(mpsToMph(windSpeedMps)) : undefined,
    windGustMph: windGustMps !== undefined ? round1(mpsToMph(windGustMps)) : undefined,
    windDirection: windDirectionDegrees !== undefined ? degreesToCompass(windDirectionDegrees) : undefined,
    waveHeightFt: waveHeightMeters !== undefined ? round1(metersToFeet(waveHeightMeters)) : undefined,
    wavePeriodSeconds: wavePeriodSeconds !== undefined ? Math.round(wavePeriodSeconds) : undefined,
    airTemperatureF: airTemperatureC !== undefined ? Math.round(celsiusToFahrenheit(airTemperatureC)) : undefined,
    waterTemperatureF: waterTemperatureC !== undefined ? Math.round(celsiusToFahrenheit(waterTemperatureC)) : undefined,
  };
}

export function parseCoopsLatestObservation(
  station: ObservationStation,
  latestPayload: CoopsWaterLevelResponse,
  recentPayload: CoopsWaterLevelResponse | null = null,
  fetchedAt = new Date().toISOString()
): StationObservation | null {
  const latest = latestPayload.data?.[0];
  const waterLevel = parseOptionalNumber(latest?.v);
  if (!latest?.t || waterLevel === undefined) return null;

  return {
    stationId: station.id,
    source: "coops",
    rawUrl: coopsLatestWaterLevelUrl(station.id),
    fetchedAt,
    observedAt: coopsTimeToIso(latest.t),
    waterLevelFt: round1(waterLevel),
    waterLevelDatum: "MLLW",
    tideState: inferTideState(recentPayload?.data),
  };
}

type CoopsWaterLevelResponse = {
  data?: Array<{
    t?: string;
    v?: string;
  }>;
};

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value || value === "MM") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function ndbcObservedAt(
  yy: string | undefined,
  month: string | undefined,
  day: string | undefined,
  hour: string | undefined,
  minute: string | undefined
): string | null {
  const yearValue = parseOptionalNumber(yy);
  const monthValue = parseOptionalNumber(month);
  const dayValue = parseOptionalNumber(day);
  const hourValue = parseOptionalNumber(hour);
  const minuteValue = parseOptionalNumber(minute);
  if (
    yearValue === undefined ||
    monthValue === undefined ||
    dayValue === undefined ||
    hourValue === undefined ||
    minuteValue === undefined
  ) {
    return null;
  }
  const year = yearValue < 100 ? 2000 + yearValue : yearValue;
  return new Date(Date.UTC(year, monthValue - 1, dayValue, hourValue, minuteValue)).toISOString();
}

function coopsTimeToIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/.exec(value);
  if (!match) return new Date(value).toISOString();
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  ).toISOString();
}

function inferTideState(data: CoopsWaterLevelResponse["data"]): StationObservation["tideState"] {
  const points =
    data
      ?.map((point) => ({ time: point.t, value: parseOptionalNumber(point.v) }))
      .filter((point): point is { time: string; value: number } => Boolean(point.time) && point.value !== undefined)
      .sort((a, b) => coopsTimeToIso(a.time).localeCompare(coopsTimeToIso(b.time))) ?? [];
  if (points.length < 2) return "unknown";

  const latest = points[points.length - 1].value;
  const previous = points[points.length - 2].value;
  const delta = latest - previous;
  if (Math.abs(delta) < 0.02) return "unknown";

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (latest === max && delta > 0) return "high";
  if (latest === min && delta < 0) return "low";
  return delta > 0 ? "rising" : "falling";
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");
}
