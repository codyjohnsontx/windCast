import type { SportType } from "./types";

export const SPORT_OPTIONS: Array<{ value: SportType; label: string }> = [
  { value: "kiteboarding", label: "Kite" },
  { value: "wing_foiling", label: "Wing" },
  { value: "downwind_foiling", label: "Downwind" },
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
