import { stationsWithinRadius } from "./distance";
import type { ObservationProvider, ObservationStation, StationObservation } from "./types";

const STATIONS: ObservationStation[] = [
  {
    id: "ndbc-bib",
    name: "Bird Island Wind",
    type: "wind_station",
    latitude: 27.47,
    longitude: -97.31,
    provider: "ndbc",
  },
  {
    id: "ndbc-tcd",
    name: "Galveston Bay Entrance",
    type: "wind_station",
    latitude: 29.36,
    longitude: -94.72,
    provider: "ndbc",
  },
  {
    id: "ndbc-pta",
    name: "Port Aransas Nearshore",
    type: "buoy",
    latitude: 27.84,
    longitude: -96.95,
    provider: "ndbc",
  },
  {
    id: "ndbc-spi",
    name: "South Padre Nearshore",
    type: "buoy",
    latitude: 26.07,
    longitude: -97.14,
    provider: "ndbc",
  },
  {
    id: "manual-lt",
    name: "Mansfield Dam Wind",
    type: "wind_station",
    latitude: 30.39,
    longitude: -97.91,
    provider: "manual",
  },
];

const OBSERVATIONS: Record<string, Omit<StationObservation, "observedAt">> = {
  "ndbc-bib": {
    stationId: "ndbc-bib",
    windSpeedMph: 20,
    windGustMph: 27,
    windDirection: "SSE",
    waterTemperatureF: 78,
  },
  "ndbc-tcd": {
    stationId: "ndbc-tcd",
    windSpeedMph: 16,
    windGustMph: 22,
    windDirection: "S",
    waterLevelFt: 1.2,
    tideState: "rising",
  },
  "ndbc-pta": {
    stationId: "ndbc-pta",
    windSpeedMph: 17,
    windGustMph: 24,
    windDirection: "ESE",
    waveHeightFt: 2.4,
    wavePeriodSeconds: 7,
  },
  "ndbc-spi": {
    stationId: "ndbc-spi",
    windSpeedMph: 19,
    windGustMph: 25,
    windDirection: "SE",
    waveHeightFt: 2.1,
    wavePeriodSeconds: 6,
  },
  "manual-lt": {
    stationId: "manual-lt",
    windSpeedMph: 14,
    windGustMph: 23,
    windDirection: "S",
    airTemperatureF: 82,
  },
};

export class MockObservationProvider implements ObservationProvider {
  readonly id = "manual";

  async getStationsNear(
    latitude: number,
    longitude: number,
    radiusMiles: number
  ): Promise<ObservationStation[]> {
    return stationsWithinRadius(STATIONS, latitude, longitude, radiusMiles);
  }

  async getLatestObservation(station: ObservationStation): Promise<StationObservation | null> {
    const observation = OBSERVATIONS[station.id];
    if (!observation) return null;
    return {
      ...observation,
      observedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    };
  }
}
