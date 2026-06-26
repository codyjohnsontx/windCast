import { describe, expect, it } from "vitest";
import type { ObservationStation } from "./types";
import { stationsWithinRadius } from "./distance";
import { preferTrustedStation, resolveStationAlias } from "./stations";

const stations: ObservationStation[] = [
  {
    id: "coops:8775237",
    name: "Port Aransas",
    type: "tide_station",
    latitude: 27.8397,
    longitude: -97.0725,
    provider: "coops",
  },
  {
    id: "ndbc:PTAT2",
    name: "Port Aransas Wind",
    type: "wind_station",
    latitude: 27.826,
    longitude: -97.05,
    provider: "ndbc",
  },
];

describe("station selection", () => {
  it("resolves legacy trusted station ids", () => {
    expect(resolveStationAlias("ndbc-pta")).toBe("ndbc:PTAT2");
    expect(resolveStationAlias("coops:8775237")).toBe("coops:8775237");
  });

  it("keeps nearest stations sorted by distance", () => {
    const nearby = stationsWithinRadius(stations, 27.8339, -97.0611, 75);
    expect(nearby.map((station) => station.id)).toEqual(["coops:8775237", "ndbc:PTAT2"]);
    expect(nearby[0].distanceMiles).toBeLessThan(nearby[1].distanceMiles ?? Infinity);
  });

  it("prefers trusted station aliases over nearest station", () => {
    expect(preferTrustedStation(stations, ["ndbc-pta"])?.id).toBe("ndbc:PTAT2");
  });
});
