import type { MapLayerDefinition, MapLayerState } from "./types";

export const MAP_LAYERS: MapLayerDefinition[] = [
  {
    id: "spots",
    label: "Saved spots",
    category: "planning",
    defaultEnabled: true,
    requiresNetwork: false,
    description: "Score-colored saved spot markers.",
  },
  {
    id: "wind-particles",
    label: "Wind particles",
    category: "wind",
    defaultEnabled: true,
    requiresNetwork: true,
    description: "Animated wind flow.",
  },
  {
    id: "observations",
    label: "Stations and buoys",
    category: "observations",
    defaultEnabled: true,
    requiresNetwork: true,
    description: "Nearby real-world wind and marine observations.",
  },
  {
    id: "radar-placeholder",
    label: "Radar",
    category: "weather",
    defaultEnabled: false,
    requiresNetwork: true,
    description: "Future precipitation radar layer.",
    disabledReason: "Radar will be added after confidence tools are stable.",
  },
  {
    id: "marine-placeholder",
    label: "Marine",
    category: "marine",
    defaultEnabled: false,
    requiresNetwork: true,
    description: "Future wave, swell, tide, and current layers.",
    disabledReason: "Marine layers will be added after observation confidence.",
  },
];

export const DEFAULT_LAYER_STATE = MAP_LAYERS.reduce((acc, layer) => {
  acc[layer.id] = layer.defaultEnabled;
  return acc;
}, {} as MapLayerState);
