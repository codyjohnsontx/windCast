import { describe, expect, it } from "vitest";
import { stationsWithinRadius } from "./distance";
import type { ObservationStation } from "./types";

const stations: ObservationStation[] = [
  {
    id: "far",
    name: "Far",
    type: "wind_station",
    latitude: 31,
    longitude: -97,
    provider: "manual",
  },
  {
    id: "near",
    name: "Near",
    type: "wind_station",
    latitude: 30.1,
    longitude: -97,
    provider: "manual",
  },
];

describe("stationsWithinRadius", () => {
  it("filters and sorts stations by distance", () => {
    const result = stationsWithinRadius(stations, 30, -97, 100);

    expect(result.map((station) => station.id)).toEqual(["near", "far"]);
    expect(result[0].distanceMiles).toBeLessThan(result[1].distanceMiles ?? Infinity);
  });
});
