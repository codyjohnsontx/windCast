import { useEffect, useState } from "react";
import SpotCard from "../components/SpotCard";
import { useSpots } from "../hooks/useSpots";
import { getForecastProvider } from "../services/forecast";
import {
  calculateForecastConfidence,
  getObservationProvider,
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
};

export default function Dashboard() {
  const { spots } = useSpots();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);

    const provider = getForecastProvider();
    const observationProvider = getObservationProvider();

    Promise.all(
      spots.map(async (spot) => {
        try {
          const forecast = await provider.getHourlyForecast(spot, 24);
          const currentHour = forecast[0];
          const currentScore = currentHour ? scoreHour(currentHour, spot) : undefined;
          const stations = await observationProvider.getStationsNear(spot.latitude, spot.longitude, 75);
          const station = preferTrustedStation(stations, spot.trustedStationIds);
          const observation = station ? await observationProvider.getLatestObservation(station) : null;
          const confidence = calculateForecastConfidence(currentHour, observation);
          return {
            spot,
            currentHour,
            currentScore,
            bestWindow: bestUpcomingHour(forecast, spot, 24),
            confidence,
            observation,
            station,
          } satisfies Row;
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
  }, [spots]);

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
            loading={rows === null}
          />
        ))}
        {spots.length === 0 && (
          <div className="card p-6 text-center text-ink-muted">
            No saved spots yet.
          </div>
        )}
      </div>
    </div>
  );
}

function preferTrustedStation(
  stations: ObservationStation[],
  trustedStationIds: string[] | undefined
): ObservationStation | undefined {
  if (trustedStationIds?.length) {
    const trusted = stations.find((station) => trustedStationIds.includes(station.id));
    if (trusted) return trusted;
  }
  return stations[0];
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
