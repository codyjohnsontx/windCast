export type MapLayerId =
  | "spots"
  | "wind-particles"
  | "observations"
  | "radar-placeholder"
  | "marine-placeholder";

export type MapLayerCategory =
  | "planning"
  | "wind"
  | "observations"
  | "weather"
  | "marine";

export type MapLayerDefinition = {
  id: MapLayerId;
  label: string;
  category: MapLayerCategory;
  defaultEnabled: boolean;
  requiresNetwork: boolean;
  implemented: boolean;
  demo?: boolean;
  lastUpdated?: string;
  description: string;
  disabledReason?: string;
};

export type MapLayerState = Record<MapLayerId, boolean>;

export type WindParticleDensity = "off" | "light" | "normal" | "dense";

export type ForecastTimelineSelection = {
  dayOffset: number;
  hourOffset: number;
};
