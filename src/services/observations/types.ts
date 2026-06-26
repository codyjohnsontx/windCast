export type ObservationStationType = "buoy" | "wind_station" | "tide_station";

export type ObservationProviderId = "ndbc" | "coops" | "manual";

type ExtensibleStringUnion<T extends string> = T | (string & {});

export type ObservationStation = {
  id: string;
  name: string;
  type: ObservationStationType;
  latitude: number;
  longitude: number;
  provider: ObservationProviderId;
  distanceMiles?: number;
  sourceLabel?: string;
  rawUrl?: string;
  supportsWind?: boolean;
  supportsWaves?: boolean;
  supportsWaterLevel?: boolean;
  supportsTidePredictions?: boolean;
};

export type StationObservation = {
  stationId: string;
  observedAt: string;
  source: ObservationProviderId;
  rawUrl?: string;
  fetchedAt: string;
  windSpeedMph?: number;
  windGustMph?: number;
  windDirection?: string;
  waveHeightFt?: number;
  wavePeriodSeconds?: number;
  waterLevelFt?: number;
  waterLevelDatum?: ExtensibleStringUnion<"MLLW" | "MSL">;
  tideState?: "rising" | "falling" | "high" | "low" | "unknown";
  airTemperatureF?: number;
  waterTemperatureF?: number;
};

export type ForecastConfidenceLabel = "high" | "medium" | "low" | "unknown";

export type ForecastConfidence = {
  label: ForecastConfidenceLabel;
  reasons: string[];
  observedAt?: string;
  windSpeedDeltaMph?: number;
  windDirectionDeltaDegrees?: number;
};

export interface ObservationProvider {
  readonly id: ObservationProviderId;
  getStationsNear(
    latitude: number,
    longitude: number,
    radiusMiles: number,
    options?: ObservationRequestOptions
  ): Promise<ObservationStation[]>;
  getLatestObservation(
    station: ObservationStation,
    options?: ObservationRequestOptions
  ): Promise<StationObservation | null>;
}

export type ObservationRequestOptions = {
  signal?: AbortSignal;
};
