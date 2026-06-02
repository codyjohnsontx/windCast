import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePreferences } from "./usePreferences";

beforeEach(() => {
  window.localStorage.clear();
});

describe("usePreferences", () => {
  it("migrates older wind-unit-only preferences", () => {
    window.localStorage.setItem("windcast.preferences", JSON.stringify({ windUnit: "knots" }));

    const { result } = renderHook(() => usePreferences());

    expect(result.current.preferences.windUnit).toBe("knots");
    expect(result.current.preferences.defaultMapLayers.spots).toBe(true);
    expect(result.current.preferences.windParticleDensity).toBe("light");
    expect(result.current.preferences.forecastDays).toBe(5);
  });

  it("sanitizes saved map layer preferences", () => {
    window.localStorage.setItem(
      "windcast.preferences",
      JSON.stringify({
        defaultMapLayers: {
          spots: false,
          observations: "false",
          unknown: true,
        },
      })
    );

    const { result } = renderHook(() => usePreferences());

    expect(result.current.preferences.defaultMapLayers.spots).toBe(false);
    expect(result.current.preferences.defaultMapLayers.observations).toBe(true);
    expect("unknown" in result.current.preferences.defaultMapLayers).toBe(false);
  });
});
