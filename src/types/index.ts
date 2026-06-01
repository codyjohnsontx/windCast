export type SportType = "kiteboarding" | "wing_foiling" | "downwind_foiling";

export type SessionScoreLabel = "poor" | "maybe" | "good" | "fire" | "sketchy";

export type Spot = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sportTypes: SportType[];
  idealWindDirections: string[];
  unsafeWindDirections: string[];
  minWindMph: number;
  idealWindMph: [number, number];
  maxWindMph: number;
  notes?: string;
};

export type ForecastHour = {
  time: string;
  windSpeedMph: number;
  windGustMph: number;
  windDirection: string;
  temperatureF?: number;
  rainChance?: number;
  waveHeightFt?: number;
  tide?: "rising" | "falling" | "high" | "low";
};

export type SessionScore = {
  label: SessionScoreLabel;
  score: number;
  reasons: string[];
};
