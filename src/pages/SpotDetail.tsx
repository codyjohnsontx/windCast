import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, RadioTower } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfidenceBadge from "../components/ConfidenceBadge";
import ForecastHourCard from "../components/ForecastHourCard";
import ObservationSummary from "../components/ObservationSummary";
import SportTagList from "../components/SportTagList";
import { useForecast } from "../hooks/useForecast";
import { usePreferences } from "../hooks/usePreferences";
import { useSpots } from "../hooks/useSpots";
import {
  calculateForecastConfidence,
  formatTideWater,
  getObservationProvider,
  preferTrustedStation,
  type ForecastConfidence,
  type ObservationStation,
  type StationObservation,
} from "../services/observations";
import { bestUpcomingHour, scoreHour } from "../utils/sessionScore";
import { formatAge, formatDayLabel, formatRange, formatWind } from "../utils/format";

export default function SpotDetail() {
  const { id } = useParams();
  const { getSpot } = useSpots();
  const { preferences } = usePreferences();
  const spot = getSpot(id);
  const { data, meta, loading, error, refetch } = useForecast(spot, 48);
  const bestWindow = data && spot ? bestUpcomingHour(data, spot, 48) : null;
  const currentHour = data?.[0];
  const currentScore = currentHour && spot ? scoreHour(currentHour, spot) : undefined;
  const [station, setStation] = useState<ObservationStation | undefined>();
  const [stations, setStations] = useState<ObservationStation[]>([]);
  const [observation, setObservation] = useState<StationObservation | null>(null);
  const confidence: ForecastConfidence = calculateForecastConfidence(currentHour, observation);

  const grouped = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, typeof data>();
    for (const hour of data) {
      const dayKey = new Date(hour.time).toDateString();
      const list = groups.get(dayKey) ?? [];
      list.push(hour);
      groups.set(dayKey, list);
    }
    return Array.from(groups.values());
  }, [data]);

  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    setStation(undefined);
    setStations([]);
    setObservation(null);
    const provider = getObservationProvider();
    provider
      .getStationsNear(spot.latitude, spot.longitude, 75)
      .then(async (nextStations) => {
        if (cancelled) return;
        const nextStation = preferTrustedStation(nextStations, spot.trustedStationIds);
        setStations(nextStations);
        setStation(nextStation);
        let nextObservation: StationObservation | null = null;
        try {
          nextObservation = nextStation
            ? await provider.getLatestObservation(nextStation)
            : null;
        } catch {
          nextObservation = null;
        }
        if (!cancelled) {
          setObservation(nextObservation);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStation(undefined);
          setObservation(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [spot]);

  if (!spot) {
    return (
      <div>
        <BackLink />
        <div className="card p-6 mt-4 text-center text-ink-muted">Spot not found.</div>
      </div>
    );
  }

  return (
    <div>
      <BackLink />
      <header className="mt-3 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{spot.name}</h1>
          </div>
          <Link to={`/spots/${spot.id}/edit`} className="icon-button" aria-label="Edit spot">
            <Pencil size={18} />
          </Link>
        </div>
        <div className="mt-2">
          <SportTagList sports={spot.sportTypes} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Meta label="Ideal wind">{formatRange(spot.idealWindMph[0], spot.idealWindMph[1], preferences.windUnit)}</Meta>
          <Meta label="Min / Max">
            {formatRange(spot.minWindMph, spot.maxWindMph, preferences.windUnit)}
          </Meta>
          <Meta label="Ideal direction">
            {spot.idealWindDirections.join(" · ") || "—"}
          </Meta>
          <Meta label="Unsafe direction">
            {spot.unsafeWindDirections.join(" · ") || "—"}
          </Meta>
        </div>
        {spot.notes && (
          <div className="card p-3 mt-4 text-sm text-ink-text/90">
            {spot.notes}
          </div>
        )}
      </header>

      {loading && (
        <div className="card p-6 text-center text-ink-muted">Loading forecast…</div>
      )}

      {error && (
        <div className="card p-4 text-score-sketchy">
          Couldn't load forecast: {error.message}
          <button
            onClick={refetch}
            className="ml-2 underline text-ink-text"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && meta?.status !== "ready" && (
        <div className="card mb-5 p-4 text-sm">
          <div className="font-semibold text-score-maybe">Forecast source degraded</div>
          <p className="mt-1 text-ink-muted">
            {meta?.message ?? "Showing fallback forecast data."}
          </p>
          <div className="mt-2 text-xs text-ink-muted">
            Source: {meta?.source}
            {meta?.fetchedAt && <> · updated {formatAge(meta.fetchedAt)}</>}
          </div>
          <button type="button" onClick={refetch} className="button-secondary mt-3">
            Retry live forecast
          </button>
        </div>
      )}

      {!loading && !error && currentHour && currentScore && (
        <section className="card p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-muted">Decision summary</div>
              <div className="mt-1 text-xl font-semibold">
                {decisionPhrase(currentScore, confidence)} · {currentScore.score}/100
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ConfidenceBadge label={confidence.label} />
            </div>
          </div>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <Meta label="Now">
              {formatWind(currentHour.windSpeedMph, preferences.windUnit)} g{" "}
              {formatWind(currentHour.windGustMph, preferences.windUnit)} {currentHour.windDirection}
            </Meta>
            <Meta label="Best window">
              {bestWindow
                ? `${formatDayLabel(bestWindow.hour.time)} ${new Date(
                    bestWindow.hour.time
                  ).toLocaleTimeString(undefined, { hour: "numeric", hour12: true })}`
                : "No usable hours"}
            </Meta>
            {observation?.waterLevelFt !== undefined && (
              <Meta label="Tide / water">{formatTideWater(observation)}</Meta>
            )}
          </div>
          <div className="mt-3">
            <ObservationSummary
              station={station}
              observation={observation}
              confidence={confidence}
              windUnit={preferences.windUnit}
            />
          </div>
          {stations.length > 0 && (
            <div className="mt-3 border-t border-ink-line pt-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-muted">Trusted station</div>
                  <div className="mt-1 text-sm">
                    {station ? (
                      <>
                        {station.name}
                        <span className="text-ink-muted"> · {station.sourceLabel ?? station.provider}</span>
                      </>
                    ) : (
                      "No station selected"
                    )}
                  </div>
                </div>
                <Link to={`/spots/${spot.id}/stations`} className="button-secondary">
                  <RadioTower size={16} /> Manage
                </Link>
              </div>
            </div>
          )}
          {currentScore.reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentScore.reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-ink-base/40 px-2 py-0.5 text-[11px] text-ink-muted ring-1 ring-ink-line"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && !error && grouped.map((day) => (
        <section key={day[0].time} className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-ink-muted mb-2">
            {formatDayLabel(day[0].time)}
          </h2>
          <div className="space-y-2">
            {day.map((hour) => (
              <ForecastHourCard
                key={hour.time}
                hour={hour}
                score={scoreHour(hour, spot)}
                windUnit={preferences.windUnit}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function decisionPhrase(score: ReturnType<typeof scoreHour>, confidence: ForecastConfidence): string {
  if (score.label === "sketchy" || score.label === "poor") return "Skip";
  if (confidence.label === "low") return "Verify first";
  if (score.label === "maybe") return "Worth watching";
  return "Go window";
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm text-ink-muted active:text-ink-text"
    >
      <ArrowLeft size={16} /> Back
    </Link>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
