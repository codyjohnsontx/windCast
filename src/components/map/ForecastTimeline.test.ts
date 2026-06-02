import { describe, expect, it } from "vitest";
import { selectedForecastHour } from "./ForecastTimeline";

describe("selectedForecastHour", () => {
  it("returns hours from now for a selected clock hour", () => {
    const now = new Date(2026, 5, 2, 10, 20);

    expect(selectedForecastHour({ dayOffset: 1, hourOffset: 12 }, now)).toBe(26);
  });

  it("clamps past same-day clock selections to now", () => {
    const now = new Date(2026, 5, 2, 10, 20);

    expect(selectedForecastHour({ dayOffset: 0, hourOffset: 6 }, now)).toBe(0);
  });
});
