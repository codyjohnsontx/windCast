import { MockObservationProvider } from "./MockObservationProvider";
import { NoaaObservationProvider } from "./NoaaObservationProvider";
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
export { rawObservationUrl, stationPageUrl } from "./providerLinks";
export { preferTrustedStation, resolveStationAlias } from "./stations";

let cached: ObservationProvider | null = null;

export function getObservationProvider(): ObservationProvider {
  if (cached) return cached;
  const id = (import.meta.env.VITE_OBSERVATION_PROVIDER ?? "mock").toLowerCase();
  cached = id === "noaa" ? new NoaaObservationProvider() : new MockObservationProvider();
  return cached;
}
