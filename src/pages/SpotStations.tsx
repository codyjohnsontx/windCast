import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePreferences } from "../hooks/usePreferences";
import { useSpots } from "../hooks/useSpots";
import {
  getObservationProvider,
  type ObservationStation,
  type StationObservation,
  resolveStationAlias,
} from "../services/observations";
import { formatAge, formatWind } from "../utils/format";

type StationRow = {
  station: ObservationStation;
  observation: StationObservation | null;
};

export default function SpotStations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSpot, upsertSpot } = useSpots();
  const { preferences } = usePreferences();
  const spot = getSpot(id);
  const [rows, setRows] = useState<StationRow[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    setRows(null);
    setError(null);
    const provider = getObservationProvider();
    provider
      .getStationsNear(spot.latitude, spot.longitude, 75)
      .then(async (stations) => {
        const nextRows = await Promise.all(
          stations.map(async (station) => ({
            station,
            observation: await provider.getLatestObservation(station).catch(() => null),
          }))
        );
        if (!cancelled) setRows(nextRows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [spot]);

  if (!spot) {
    return (
      <div>
        <BackLink to="/" />
        <div className="card p-6 mt-4 text-center text-ink-muted">Spot not found.</div>
      </div>
    );
  }

  const trustedId = spot.trustedStationIds?.[0];
  const resolvedTrustedId = trustedId ? resolveStationAlias(trustedId) : undefined;

  return (
    <div>
      <BackLink to={`/spots/${spot.id}`} />
      <header className="mt-3 mb-5">
        <h1 className="text-2xl font-bold">Station picker</h1>
        <p className="mt-1 text-sm text-ink-muted">{spot.name}</p>
      </header>

      {error && (
        <div className="card p-4 mb-4 text-score-sketchy">
          Couldn't load nearby stations: {error.message}
        </div>
      )}

      {rows === null && <div className="card p-6 text-center text-ink-muted">Loading stations...</div>}

      {rows?.length === 0 && (
        <div className="card p-6 text-center text-ink-muted">No supported station within 75 miles.</div>
      )}

      <div className="space-y-3">
        {rows?.map(({ station, observation }) => {
          const selected = station.id === resolvedTrustedId || station.id === trustedId;
          return (
            <section
              key={station.id}
              className={`card p-4 ${selected ? "ring-2 ring-score-good" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{station.name}</h2>
                    <SourceBadge station={station} />
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    {station.distanceMiles !== undefined
                      ? `${Math.round(station.distanceMiles)} mi away`
                      : "Distance unavailable"}
                    {observation?.observedAt && <> · {formatAge(observation.observedAt)}</>}
                  </div>
                </div>
                {selected && (
                  <span className="rounded-full bg-score-good/15 px-2 py-1 text-[11px] font-semibold text-score-good">
                    Selected
                  </span>
                )}
              </div>

              <div className="mt-3 text-sm">
                {observation ? (
                  <StationReading observation={observation} windUnit={preferences.windUnit} />
                ) : (
                  <span className="text-ink-muted">Latest observation unavailable.</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {station.supportsWind && <Capability>Wind</Capability>}
                {station.supportsWaves && <Capability>Waves</Capability>}
                {(station.supportsWaterLevel || station.supportsTidePredictions) && <Capability>Tide</Capability>}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={selected ? "button-secondary" : "button-primary"}
                  onClick={() => {
                    upsertSpot({ ...spot, trustedStationIds: [station.id] });
                    navigate(`/spots/${spot.id}`);
                  }}
                >
                  Use station
                </button>
                {(observation?.rawUrl ?? station.rawUrl) && (
                  <a
                    href={observation?.rawUrl ?? station.rawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary"
                  >
                    Raw provider
                  </a>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm text-ink-muted active:text-ink-text">
      <ArrowLeft size={16} /> Back
    </Link>
  );
}

function SourceBadge({ station }: { station: ObservationStation }) {
  return (
    <span className="rounded-full bg-ink-base/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted ring-1 ring-ink-line">
      {station.sourceLabel ?? station.provider}
    </span>
  );
}

function Capability({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-ink-base/40 px-2 py-0.5 text-[11px] text-ink-muted ring-1 ring-ink-line">
      {children}
    </span>
  );
}

function StationReading({
  observation,
  windUnit,
}: {
  observation: StationObservation;
  windUnit: ReturnType<typeof usePreferences>["preferences"]["windUnit"];
}) {
  const lines: string[] = [];
  if (observation.windSpeedMph !== undefined) {
    lines.push(
      `${formatWind(observation.windSpeedMph, windUnit)}${
        observation.windGustMph !== undefined ? ` g ${formatWind(observation.windGustMph, windUnit)}` : ""
      }${observation.windDirection ? ` ${observation.windDirection}` : ""}`
    );
  }
  if (observation.waterLevelFt !== undefined) {
    lines.push(
      `${formatTideState(observation.tideState)}${observation.tideState ? " · " : ""}${observation.waterLevelFt} ft ${
        observation.waterLevelDatum ?? "MLLW"
      }`
    );
  }
  if (observation.waveHeightFt !== undefined) {
    lines.push(
      `Waves ${observation.waveHeightFt} ft${
        observation.wavePeriodSeconds !== undefined ? ` · ${observation.wavePeriodSeconds}s` : ""
      }`
    );
  }
  return lines.length ? <>{lines.join(" · ")}</> : <span className="text-ink-muted">No wind or water data.</span>;
}

function formatTideState(state: StationObservation["tideState"]): string {
  if (!state || state === "unknown") return "Water";
  return state[0].toUpperCase() + state.slice(1);
}
