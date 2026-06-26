import { afterEach, describe, expect, it, vi } from "vitest";
import { NoaaObservationProvider, parseCoopsLatestObservation, parseNdbcLatestObservation } from "./NoaaObservationProvider";
import type { ObservationStation } from "./types";

const ndbcStation: ObservationStation = {
  id: "ndbc:PTAT2",
  name: "Port Aransas",
  type: "wind_station",
  latitude: 27.826,
  longitude: -97.05,
  provider: "ndbc",
};

const coopsStation: ObservationStation = {
  id: "coops:8775237",
  name: "Port Aransas",
  type: "tide_station",
  latitude: 27.8397,
  longitude: -97.0725,
  provider: "coops",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("NoaaObservationProvider parsers", () => {
  it("parses and converts the latest NDBC row", () => {
    const observation = parseNdbcLatestObservation(
      ndbcStation,
      `#YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS TIDE
2026 06 20 18 50 140 8.0 11.0 1.2 7 MM 130 1012.0 29.0 28.0 MM MM MM`,
      "2026-06-20T19:00:00.000Z"
    );

    expect(observation).toMatchObject({
      stationId: "ndbc:PTAT2",
      source: "ndbc",
      observedAt: "2026-06-20T18:50:00.000Z",
      fetchedAt: "2026-06-20T19:00:00.000Z",
      windDirection: "SE",
      wavePeriodSeconds: 7,
      airTemperatureF: 84,
      waterTemperatureF: 82,
    });
    expect(observation?.windSpeedMph).toBeCloseTo(17.9, 1);
    expect(observation?.windGustMph).toBeCloseTo(24.6, 1);
    expect(observation?.waveHeightFt).toBeCloseTo(3.9, 1);
  });

  it("handles missing NDBC values", () => {
    const observation = parseNdbcLatestObservation(
      ndbcStation,
      `#YY MM DD hh mm WDIR WSPD GST WVHT
2026 06 20 18 50 MM MM MM MM`
    );

    expect(observation?.observedAt).toBe("2026-06-20T18:50:00.000Z");
    expect(observation?.windSpeedMph).toBeUndefined();
    expect(observation?.windDirection).toBeUndefined();
  });

  it("parses CO-OPS latest water level and infers tide state", () => {
    const observation = parseCoopsLatestObservation(
      coopsStation,
      { data: [{ t: "2026-06-20 18:48", v: "1.24" }] },
      {
        data: [
          { t: "2026-06-20 18:00", v: "1.10" },
          { t: "2026-06-20 18:06", v: "1.16" },
          { t: "2026-06-20 18:12", v: "1.24" },
        ],
      },
      "2026-06-20T19:00:00.000Z"
    );

    expect(observation).toMatchObject({
      stationId: "coops:8775237",
      source: "coops",
      observedAt: "2026-06-20T18:48:00.000Z",
      fetchedAt: "2026-06-20T19:00:00.000Z",
      waterLevelFt: 1.2,
      waterLevelDatum: "MLLW",
      tideState: "high",
    });
  });
});

describe("NoaaObservationProvider", () => {
  it("returns null on failed station observation fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(new NoaaObservationProvider().getLatestObservation(ndbcStation)).resolves.toBeNull();
  });

  it("caches repeated station fetches within the TTL", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `#YY MM DD hh mm WDIR WSPD GST
2026 06 20 18 50 140 8.0 11.0`,
    });
    vi.stubGlobal("fetch", fetch);

    const provider = new NoaaObservationProvider();
    await provider.getLatestObservation(ndbcStation);
    await provider.getLatestObservation(ndbcStation);

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
