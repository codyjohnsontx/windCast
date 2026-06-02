import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { useMemo } from "react";
import ForecastHourCard from "../components/ForecastHourCard";
import SportTagList from "../components/SportTagList";
import { useForecast } from "../hooks/useForecast";
import { usePreferences } from "../hooks/usePreferences";
import { useSpots } from "../hooks/useSpots";
import { bestUpcomingHour, scoreHour } from "../utils/sessionScore";
import { formatDayLabel, formatRange } from "../utils/format";

export default function SpotDetail() {
  const { id } = useParams();
  const { getSpot } = useSpots();
  const { preferences } = usePreferences();
  const spot = getSpot(id);
  const { data, loading, error, refetch } = useForecast(spot, 48);
  const bestWindow = data && spot ? bestUpcomingHour(data, spot, 48) : null;

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

      {!loading && !error && bestWindow && (
        <section className="card p-4 mb-5">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Best window</div>
          <div className="mt-1 text-lg font-semibold">
            {formatDayLabel(bestWindow.hour.time)} at{" "}
            {new Date(bestWindow.hour.time).toLocaleTimeString(undefined, { hour: "numeric", hour12: true })}
          </div>
          <div className="mt-1 text-sm text-ink-muted">
            {bestWindow.score.label} · {bestWindow.score.score}/100
          </div>
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
