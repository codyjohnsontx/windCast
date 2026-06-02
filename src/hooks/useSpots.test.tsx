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

  it("loads valid saved spots even when another saved spot is invalid", () => {
    window.localStorage.setItem(
      "windcast.spots",
      JSON.stringify([spot, { ...spot, id: "bad", latitude: 200 }])
    );

    const { result } = renderHook(() => useSpots());

    expect(result.current.spots).toEqual([expect.objectContaining(spot)]);
  });

  it("does not overwrite unparseable saved spot data on mount", () => {
    window.localStorage.setItem("windcast.spots", "{bad json");

    renderHook(() => useSpots());

    expect(window.localStorage.getItem("windcast.spots")).toBe("{bad json");
  });
});
