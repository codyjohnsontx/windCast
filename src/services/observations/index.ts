import { MockObservationProvider } from "./MockObservationProvider";
import type { ObservationProvider } from "./types";

export type {
  ForecastConfidence,
  ForecastConfidenceLabel,
  ObservationProvider,
  ObservationProviderId,
  ObservationStation,
  ObservationStationType,
  StationObservation,
} from "./types";
export { calculateForecastConfidence, isObservationFresh } from "./confidence";
export { distanceMiles, stationsWithinRadius } from "./distance";

let cached: ObservationProvider | null = null;

export function getObservationProvider(): ObservationProvider {
  if (cached) return cached;
  cached = new MockObservationProvider();
  return cached;
}
