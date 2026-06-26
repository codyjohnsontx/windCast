import { describe, expect, it } from "vitest";
import { DEFAULT_LAYER_STATE, MAP_LAYERS } from "./catalog";

describe("layer catalog", () => {
  it("builds defaults from layer definitions", () => {
    for (const layer of MAP_LAYERS) {
      expect(DEFAULT_LAYER_STATE[layer.id]).toBe(layer.defaultEnabled);
    }
  });

  it("keeps radar and marine disabled as placeholders", () => {
    expect(DEFAULT_LAYER_STATE["radar-placeholder"]).toBe(false);
    expect(DEFAULT_LAYER_STATE["marine-placeholder"]).toBe(false);
  });

  it("labels demo layers so synthetic data is visible to users", () => {
    expect(MAP_LAYERS.find((layer) => layer.id === "wind-particles")?.demo).toBe(true);
    expect(MAP_LAYERS.find((layer) => layer.id === "observations")?.demo).toBe(true);
    expect(MAP_LAYERS.find((layer) => layer.id === "marine-placeholder")?.implemented).toBe(false);
  });
});
