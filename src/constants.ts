import type { SportType } from "./types";
import type { SpotEnvironment } from "./types";

export const SPORT_OPTIONS: Array<{ value: SportType; label: string }> = [
  { value: "kiteboarding", label: "Kite" },
  { value: "wing_foiling", label: "Wing" },
  { value: "downwind_foiling", label: "Downwind" },
];

export const ENVIRONMENT_OPTIONS: Array<{ value: SpotEnvironment; label: string }> = [
  { value: "inland", label: "Inland" },
  { value: "coastal", label: "Coastal" },
];

export const COMPASS_OPTIONS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];
