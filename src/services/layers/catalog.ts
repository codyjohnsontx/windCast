import type { MapLayerDefinition, MapLayerState } from "./types";

export const MAP_LAYERS: MapLayerDefinition[] = [
  {
    id: "spots",
    label: "Saved spots",
    category: "planning",
    defaultEnabled: true,
    requiresNetwork: false,
    implemented: true,
    description: "Score-colored saved spot markers.",
  },
  {
    id: "wind-particles",
    label: "Wind particles",
    category: "wind",
    defaultEnabled: true,
    requiresNetwork: true,
    implemented: true,
    demo: true,
    lastUpdated: "Synthetic sample grid",
    description: "Animated wind flow. Demo unless NOAA GFS proxy is configured.",
  },
  {
    id: "observations",
    label: "Stations and buoys",
    category: "observations",
    defaultEnabled: true,
    requiresNetwork: true,
    implemented: true,
    demo: true,
    lastUpdated: "Manual sample observations",
    description: "Nearby real-world wind and marine observations.",
  },
  {
    id: "radar-placeholder",
    label: "Radar",
    category: "weather",
    defaultEnabled: false,
    requiresNetwork: true,
    implemented: false,
    description: "Future precipitation radar layer.",
    disabledReason: "Radar will be added after confidence tools are stable.",
  },
  {
    id: "marine-placeholder",
    label: "Marine",
    category: "marine",
    defaultEnabled: false,
    requiresNetwork: true,
    implemented: false,
    description: "Future NOAA tide, water level, wave, swell, and current layers.",
    disabledReason: "NOAA CO-OPS tide and water level should be the next real marine layer.",
  },
];

export const DEFAULT_LAYER_STATE = MAP_LAYERS.reduce((acc, layer) => {
  acc[layer.id] = layer.defaultEnabled;
  return acc;
}, {} as MapLayerState);
