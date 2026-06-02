import { describe, expect, it } from "vitest";
import type { ForecastHour } from "../../types";
import { calculateForecastConfidence } from "./confidence";
import type { StationObservation } from "./types";

const now = new Date("2026-06-02T12:00:00.000Z");
const forecast: ForecastHour = {
  time: now.toISOString(),
  windSpeedMph: 18,
  windGustMph: 24,
  windDirection: "SE",
};

function observation(overrides: Partial<StationObservation>): StationObservation {
  return {
    stationId: "station",
    observedAt: "2026-06-02T11:30:00.000Z",
    windSpeedMph: 17,
    windDirection: "SE",
    ...overrides,
  };
}

describe("calculateForecastConfidence", () => {
  it("returns unknown without an observation", () => {
    expect(calculateForecastConfidence(forecast, null, now).label).toBe("unknown");
  });

  it("returns unknown for stale observations", () => {
    const result = calculateForecastConfidence(
      forecast,
      observation({ observedAt: "2026-06-02T08:00:00.000Z" }),
      now
    );
    expect(result.label).toBe("unknown");
  });

  it("returns high when forecast and observation match", () => {
    expect(calculateForecastConfidence(forecast, observation({}), now).label).toBe("high");
  });

  it("returns low when forecast and observation materially disagree", () => {
    const result = calculateForecastConfidence(
      forecast,
      observation({ windSpeedMph: 4, windDirection: "NW" }),
      now
    );
    expect(result.label).toBe("low");
  });
});
