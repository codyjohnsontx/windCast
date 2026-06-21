import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SpotCard from "../components/SpotCard";
import { useSpots } from "../hooks/useSpots";
import { getHourlyForecastResult, type ForecastSourceMeta } from "../services/forecast";
import {
  calculateForecastConfidence,
  distanceMiles,
  getObservationProvider,
  preferTrustedStation,
  type ForecastConfidence,
  type ObservationStation,
  type StationObservation,
} from "../services/observations";
import { bestUpcomingHour, scoreHour } from "../utils/sessionScore";
import type { ForecastHour, SessionScore, Spot } from "../types";

type Row = {
  spot: Spot;
  currentHour?: ForecastHour;
  currentScore?: SessionScore;
  bestWindow: { hour: ForecastHour; score: SessionScore } | null;
  confidence?: ForecastConfidence;
  observation?: StationObservation | null;
  station?: ObservationStation;
  stationDistanceMiles?: number;
  forecastMeta?: ForecastSourceMeta;
};

export default function Dashboard() {
  const { spots } = useSpots();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);

    const observationProvider = getObservationProvider();

    Promise.all(
      spots.map(async (spot) => {
        let forecast: ForecastHour[];
        let forecastMeta: ForecastSourceMeta | undefined;
        try {
          const result = await getHourlyForecastResult(spot, 24);
          forecast = result.hours;
          forecastMeta = result.meta;
        } catch (error) {
          console.error("Failed to load forecast for dashboard spot.", {
            spotId: spot.id,
            spotName: spot.name,
            error,
          });
          return {
            spot,
            bestWindow: null,
            confidence: { label: "unknown", reasons: ["Forecast unavailable"] },
          } satisfies Row;
        }

        const currentHour = forecast[0];
        const currentScore = currentHour ? scoreHour(currentHour, spot) : undefined;
        const bestWindow = bestUpcomingHour(forecast, spot, 24);
        let station: ObservationStation | undefined;
        let stationDistanceMiles: number | undefined;
        let observation: StationObservation | null = null;

        try {
          const stations = await observationProvider.getStationsNear(spot.latitude, spot.longitude, 75);
          station = preferTrustedStation(stations, spot.trustedStationIds);
          stationDistanceMiles = station
            ? distanceMiles(spot.latitude, spot.longitude, station.latitude, station.longitude)
            : undefined;
          observation = station ? await observationProvider.getLatestObservation(station) : null;
        } catch (error) {
          console.error("Failed to load observations for dashboard spot.", {
            spotId: spot.id,
            spotName: spot.name,
            error,
          });
        }

        return {
          spot,
          currentHour,
          currentScore,
          bestWindow,
          confidence: calculateForecastConfidence(currentHour, observation),
          observation,
          station,
          stationDistanceMiles,
          forecastMeta,
        } satisfies Row;
      })
    )
      .then((result) => {
        if (!cancelled) setRows(sortRows(result));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
    };
  }, [spots, refreshKey]);

  const degradedRows = rows?.filter((row) => row.forecastMeta?.status !== "ready") ?? [];

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Find your next wind window.</h1>
        <p className="text-ink-muted text-sm mt-1">
          Know when it's worth rigging.
        </p>
      </header>

      {error && (
        <div className="card p-4 mb-4 text-score-sketchy">
          Couldn't load forecasts: {error.message}
        </div>
      )}

      {degradedRows.length > 0 && (
        <div className="card mb-4 p-4 text-sm">
          <div className="font-semibold text-score-maybe">Forecasts are degraded</div>
          <p className="mt-1 text-ink-muted">
            {degradedRows[0].forecastMeta?.message ?? "Showing fallback forecast data."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="button-secondary" onClick={() => setRefreshKey((key) => key + 1)}>
              Retry all
            </button>
            <Link to="/settings" className="button-secondary">
              Forecast settings
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(rows ?? spots.map((spot) => ({ spot } as Row))).map((row) => (
          <SpotCard
            key={row.spot.id}
            spot={row.spot}
            currentHour={row.currentHour}
            currentScore={row.currentScore}
            bestWindow={row.bestWindow}
            confidence={row.confidence}
            observation={row.observation}
            station={row.station}
            stationDistanceMiles={row.stationDistanceMiles}
            forecastMeta={row.forecastMeta}
            loading={rows === null}
          />
        ))}
        {spots.length === 0 && (
          <div className="card p-6 text-center">
            <div className="font-semibold">No saved spots yet.</div>
            <p className="mt-1 text-sm text-ink-muted">
              Add your launch, pick from the map, or import a saved backup.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link to="/spots/new" className="button-primary">Add spot</Link>
              <Link to="/map" className="button-secondary">Use map</Link>
              <Link to="/settings" className="button-secondary">Import spots</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function sortRows(rows: Row[]): Row[] {
  return rows.slice().sort((a, b) => {
    const aSketchy = a.currentScore?.label === "sketchy" ? 1 : 0;
    const bSketchy = b.currentScore?.label === "sketchy" ? 1 : 0;
    if (aSketchy !== bSketchy) return aSketchy - bSketchy;
    const scoreDiff = (b.currentScore?.score ?? -1) - (a.currentScore?.score ?? -1);
    if (scoreDiff !== 0) return scoreDiff;
    const confidenceDiff = confidenceRank(b.confidence?.label) - confidenceRank(a.confidence?.label);
    if (confidenceDiff !== 0) return confidenceDiff;
    return (bestTime(a) ?? Infinity) - (bestTime(b) ?? Infinity);
  });
}

function confidenceRank(label: ForecastConfidence["label"] | undefined): number {
  if (label === "high") return 3;
  if (label === "medium") return 2;
  if (label === "low") return 1;
  return 0;
}

function bestTime(row: Row): number | null {
  return row.bestWindow ? new Date(row.bestWindow.hour.time).getTime() : null;
}
