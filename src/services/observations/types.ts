export type ObservationStationType = "buoy" | "wind_station" | "tide_station";

export type ObservationProviderId = "ndbc" | "coops" | "manual";

export type ObservationStation = {
  id: string;
  name: string;
  type: ObservationStationType;
  latitude: number;
  longitude: number;
  provider: ObservationProviderId;
  distanceMiles?: number;
};

export type StationObservation = {
  stationId: string;
  observedAt: string;
  windSpeedMph?: number;
  windGustMph?: number;
  windDirection?: string;
  waveHeightFt?: number;
  wavePeriodSeconds?: number;
  waterLevelFt?: number;
  tideState?: "rising" | "falling" | "high" | "low";
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
    radiusMiles: number
  ): Promise<ObservationStation[]>;
  getLatestObservation(station: ObservationStation): Promise<StationObservation | null>;
}
