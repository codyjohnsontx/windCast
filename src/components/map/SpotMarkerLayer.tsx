import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { ForecastHour, SessionScore, Spot } from "../../types";
import type { SessionScoreLabel } from "../../types";
import { useSpots } from "../../hooks/useSpots";
import { usePreferences } from "../../hooks/usePreferences";
import { getHourlyForecastResult, type ForecastSourceMeta } from "../../services/forecast";
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
    let cancelled = false;
    setStates(spots.map((spot) => ({ spot, loading: true })));
    Promise.all(
      spots.map(async (spot) => {
        try {
          const result = await getHourlyForecastResult(spot, hourOffset + 1);
          const hours = result.hours;
          const current = hours[hourOffset] ?? hours[0];
          return {
            spot,
            current,
            score: current ? scoreHour(current, spot) : undefined,
            forecastMeta: result.meta,
            loading: false,
          } satisfies SpotMarkerState;
        } catch {
          return { spot, loading: false, error: true } satisfies SpotMarkerState;
        }
      })
    ).then((result) => {
      if (!cancelled) setStates(result);
    });
    return () => {
      cancelled = true;
    };
  }, [spots, hourOffset]);

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
