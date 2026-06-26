import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { ForecastHour, SessionScore, Spot } from "../../types";
import type { SessionScoreLabel } from "../../types";
import { useSpots } from "../../hooks/useSpots";
import { usePreferences } from "../../hooks/usePreferences";
import { getHourlyForecastResult, type ForecastSourceMeta } from "../../services/forecast";
import {
  calculateForecastConfidence,
  getObservationProvider,
  preferTrustedStation,
  type ForecastConfidence,
  type ObservationStation,
  type StationObservation,
} from "../../services/observations";
import { scoreHour } from "../../utils/sessionScore";
import { formatWind } from "../../utils/format";

const COLORS: Record<SessionScoreLabel, string> = {
  fire: "#f97316",
  good: "#22c55e",
  maybe: "#eab308",
  poor: "#64748b",
  sketchy: "#ef4444",
};

function pinIcon(color: string): L.DivIcon {
  const html = `
    <span style="
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:22px;
      height:22px;
      border-radius:9999px;
      background:${color};
      box-shadow:0 0 0 3px rgba(11,18,32,0.85), 0 0 0 4px ${color}66;
      border:2px solid #0b1220;
    "></span>
  `;
  return L.divIcon({
    html,
    className: "windcast-spot-pin",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

export type SpotMarkerState = {
  spot: Spot;
  current?: ForecastHour;
  score?: SessionScore;
  forecastMeta?: ForecastSourceMeta;
  confidence?: ForecastConfidence;
  station?: ObservationStation;
  observation?: StationObservation | null;
  loading?: boolean;
  error?: boolean;
};

type Props = {
  hourOffset: number;
  onSelectSpot?: (state: SpotMarkerState) => void;
};

export default function SpotMarkerLayer({ hourOffset, onSelectSpot }: Props) {
  const { spots } = useSpots();
  const { preferences } = usePreferences();
  const [states, setStates] = useState<SpotMarkerState[]>(spots.map((spot) => ({ spot, loading: true })));

  useEffect(() => {
    const controller = new AbortController();
    setStates((prev) =>
      spots.map((spot) => ({
        ...prev.find((state) => state.spot.id === spot.id),
        spot,
        current: undefined,
        score: undefined,
        forecastMeta: undefined,
        confidence: undefined,
        loading: true,
        error: false,
      }))
    );
    Promise.all(
      spots.map(async (spot) => {
        try {
          const result = await getHourlyForecastResult(spot, hourOffset + 1, {
            signal: controller.signal,
          });
          const hours = result.hours;
          const current = hours[hourOffset] ?? hours[0];
          return {
            spot,
            current,
            score: current ? scoreHour(current, spot) : undefined,
            forecastMeta: result.meta,
            loading: false,
          } satisfies SpotMarkerState;
        } catch (error) {
          if (isAbortError(error)) {
            return { spot, loading: true } satisfies SpotMarkerState;
          }
          return { spot, loading: false, error: true } satisfies SpotMarkerState;
        }
      })
    ).then((result) => {
      if (!controller.signal.aborted) {
        setStates((prev) => mergeSpotStates(spots, prev, result));
      }
    });
    return () => {
      controller.abort();
    };
  }, [spots, hourOffset]);

  useEffect(() => {
    const controller = new AbortController();
    const observationProvider = getObservationProvider();
    setStates((prev) =>
      spots.map((spot) => ({
        ...prev.find((state) => state.spot.id === spot.id),
        spot,
        station: undefined,
        observation: null,
      }))
    );
    Promise.all(
      spots.map(async (spot) => {
        let station: ObservationStation | undefined;
        let observation: StationObservation | null = null;
        try {
          const stations = await observationProvider.getStationsNear(spot.latitude, spot.longitude, 75, {
            signal: controller.signal,
          });
          station = preferTrustedStation(stations, spot.trustedStationIds);
          observation = station
            ? await observationProvider.getLatestObservation(station, { signal: controller.signal })
            : null;
        } catch (error) {
          if (!isAbortError(error)) {
            console.error("Failed to load spot marker observation.", {
              spotId: spot.id,
              error,
            });
          }
        }
        return {
          spot,
          station,
          observation,
        } satisfies SpotMarkerState;
      })
    ).then((result) => {
      if (!controller.signal.aborted) {
        setStates((prev) => mergeSpotStates(spots, prev, result));
      }
    });
    return () => {
      controller.abort();
    };
  }, [spots]);

  return (
    <>
      {states.map((state) => {
        const { spot, current, score, forecastMeta, loading, error } = state;
        const color = score ? COLORS[score.label] : COLORS.poor;
        return (
          <Marker
            key={`${spot.id}:${loading ? "loading" : score?.label ?? (error ? "error" : "ready")}`}
            position={[spot.latitude, spot.longitude]}
            icon={pinIcon(color)}
            title={`${spot.name}${score ? ` ${score.label}` : loading ? " loading" : error ? " unavailable" : ""}`}
            eventHandlers={{ click: () => onSelectSpot?.(state) }}
          >
            <Popup>
              <div className="text-sm" style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{spot.name}</div>
                {loading && <div style={{ marginTop: 4, color: "#64748b" }}>Checking forecast…</div>}
                {error && <div style={{ marginTop: 4, color: "#ef4444" }}>Forecast unavailable.</div>}
                {score && (
                  <div style={{ marginTop: 4, textTransform: "uppercase", fontSize: 11, color }}>
                    {score.label}
                  </div>
                )}
                {current && (
                  <div style={{ marginTop: 6, color: "#334155" }}>
                    {formatWind(current.windSpeedMph, preferences.windUnit)}{" "}
                    <span style={{ opacity: 0.7 }}>
                      g {formatWind(current.windGustMph, preferences.windUnit)} · {current.windDirection}
                    </span>
                  </div>
                )}
                {forecastMeta && forecastMeta.status !== "ready" && (
                  <div style={{ marginTop: 6, color: "#92400e", fontSize: 11 }}>
                    {forecastMeta.message ?? forecastMeta.source}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <Link
                    to={`/spots/${spot.id}`}
                    style={{
                      color: "#2563eb",
                      fontWeight: 500,
                      textDecoration: "underline",
                    }}
                  >
                    View spot
                  </Link>
                  <Link
                    to={`/spots/${spot.id}/edit`}
                    style={{
                      color: "#2563eb",
                      fontWeight: 500,
                      textDecoration: "underline",
                    }}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function mergeSpotStates(
  spots: Spot[],
  previousStates: SpotMarkerState[],
  updates: SpotMarkerState[]
): SpotMarkerState[] {
  const previousById = new Map(previousStates.map((state) => [state.spot.id, state]));
  const updateById = new Map(updates.map((state) => [state.spot.id, state]));
  return spots.map((spot) => {
    const previous = previousById.get(spot.id);
    const update = updateById.get(spot.id);
    const next = { ...previous, ...update, spot };
    return {
      ...next,
      confidence: calculateForecastConfidence(next.current, next.observation ?? null),
    };
  });
}
