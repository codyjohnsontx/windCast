import { useEffect, useState } from "react";
import SpotCard from "../components/SpotCard";
import { useSpots } from "../hooks/useSpots";
import { getForecastProvider } from "../services/forecast";
import { bestUpcomingHour, scoreHour } from "../utils/sessionScore";
import type { ForecastHour, SessionScore, Spot } from "../types";

type Row = {
  spot: Spot;
  currentHour?: ForecastHour;
  currentScore?: SessionScore;
  bestWindow: { hour: ForecastHour; score: SessionScore } | null;
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

    Promise.all(
      spots.map(async (spot) => {
        try {
          const forecast = await provider.getHourlyForecast(spot, 24);
          const currentHour = forecast[0];
          const currentScore = currentHour ? scoreHour(currentHour, spot) : undefined;
          return {
            spot,
            currentHour,
            currentScore,
            bestWindow: bestUpcomingHour(forecast, spot, 24),
          } satisfies Row;
        } catch (error) {
          console.error("Failed to load forecast for dashboard spot.", {
            spotId: spot.id,
            spotName: spot.name,
            error,
          });
          return { spot, bestWindow: null } satisfies Row;
        }
      })
    )
      .then((result) => {
        if (!cancelled) setRows(result);
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
