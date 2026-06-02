import { describe, expect, it } from "vitest";
import type { ForecastHour, Spot } from "../types";
import { bestUpcomingHour, scoreHour } from "./sessionScore";

const spot: Spot = {
  id: "test",
  name: "Test",
  latitude: 27,
  longitude: -97,
  sportTypes: ["kiteboarding"],
  idealWindDirections: ["SE"],
  unsafeWindDirections: ["NW"],
  minWindMph: 12,
  idealWindMph: [16, 24],
  maxWindMph: 32,
};

const hour: ForecastHour = {
  time: "2026-06-01T12:00:00.000Z",
  windSpeedMph: 18,
  windGustMph: 22,
  windDirection: "SE",
  rainChance: 0,
};

describe("scoreHour", () => {
  it("marks unsafe direction as sketchy", () => {
    expect(scoreHour({ ...hour, windDirection: "NW" }, spot).label).toBe("sketchy");
  });

  it("marks wind above max as sketchy", () => {
    expect(scoreHour({ ...hour, windSpeedMph: 34 }, spot).label).toBe("sketchy");
  });

  it("marks gusts more than five mph over max as sketchy", () => {
    expect(scoreHour({ ...hour, windGustMph: 38 }, spot).label).toBe("sketchy");
  });

  it("penalizes rain and gust spread", () => {
    const clear = scoreHour(hour, spot);
    const messy = scoreHour({ ...hour, windGustMph: 30, rainChance: 0.7 }, spot);
    expect(messy.score).toBeLessThan(clear.score);
  });
});

describe("bestUpcomingHour", () => {
  it("skips sketchy hours", () => {
    const result = bestUpcomingHour(
      [
        { ...hour, time: "2026-06-01T12:00:00.000Z", windDirection: "NW" },
        { ...hour, time: "2026-06-01T13:00:00.000Z", windDirection: "SE" },
      ],
      spot,
      2
    );
    expect(result?.hour.time).toBe("2026-06-01T13:00:00.000Z");
  });
});
