import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMapLayers } from "./useMapLayers";

describe("useMapLayers", () => {
  it("loads default layer state and toggles layers", () => {
    const { result } = renderHook(() => useMapLayers());

    expect(result.current.layers.spots).toBe(true);
    expect(result.current.layers["radar-placeholder"]).toBe(false);

    act(() => result.current.toggleLayer("spots"));
    expect(result.current.layers.spots).toBe(false);

    act(() => result.current.setLayerEnabled("spots", true));
    expect(result.current.layers.spots).toBe(true);
  });
});
