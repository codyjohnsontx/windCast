import type { StationObservation } from "./types";

export function formatTideWater(observation: Pick<StationObservation, "tideState" | "waterLevelFt" | "waterLevelDatum">): string {
  const state = formatTideState(observation.tideState);
  return `${state} · ${observation.waterLevelFt} ft ${observation.waterLevelDatum ?? "MLLW"}`;
}

export function formatTideState(state: StationObservation["tideState"]): string {
  if (!state || state === "unknown") return "Water";
  return state[0].toUpperCase() + state.slice(1);
}
