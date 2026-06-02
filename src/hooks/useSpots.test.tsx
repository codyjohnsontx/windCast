import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSpots, validateSpots } from "./useSpots";
import type { Spot } from "../types";

const spot: Spot = {
  id: "custom",
  name: "Custom",
  latitude: 28,
  longitude: -96,
  sportTypes: ["wing_foiling"],
  idealWindDirections: ["SE"],
  unsafeWindDirections: ["NW"],
  minWindMph: 12,
  idealWindMph: [16, 24],
  maxWindMph: 32,
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("useSpots", () => {
  it("persists upserted spots to localStorage", () => {
    const { result } = renderHook(() => useSpots());
    act(() => result.current.upsertSpot(spot));
    expect(JSON.parse(window.localStorage.getItem("windcast.spots") ?? "[]")).toContainEqual(spot);
  });

  it("rejects invalid imports", () => {
    expect(() => validateSpots([{ ...spot, latitude: 200 }])).toThrow(/invalid latitude/i);
  });
});
