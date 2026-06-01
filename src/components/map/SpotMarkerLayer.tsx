import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { ForecastHour, SessionScore, Spot } from "../../types";
import type { SessionScoreLabel } from "../../types";
import { useSpots } from "../../hooks/useSpots";
import { getForecastProvider } from "../../services/forecast";
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

type SpotState = {
  spot: Spot;
  current?: ForecastHour;
  score?: SessionScore;
};

export default function SpotMarkerLayer() {
  const { spots } = useSpots();
  const [states, setStates] = useState<SpotState[]>(spots.map((spot) => ({ spot })));

  useEffect(() => {
    let cancelled = false;
    const provider = getForecastProvider();
    Promise.all(
      spots.map(async (spot) => {
        try {
          const hours = await provider.getHourlyForecast(spot, 1);
          const current = hours[0];
          return {
            spot,
            current,
            score: current ? scoreHour(current, spot) : undefined,
          } satisfies SpotState;
        } catch {
          return { spot } satisfies SpotState;
        }
      })
    ).then((result) => {
      if (!cancelled) setStates(result);
    });
    return () => {
      cancelled = true;
    };
  }, [spots]);

  return (
    <>
      {states.map(({ spot, current, score }) => {
        const color = score ? COLORS[score.label] : COLORS.poor;
        return (
          <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={pinIcon(color)}>
            <Popup>
              <div className="text-sm" style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{spot.name}</div>
                {score && (
                  <div style={{ marginTop: 4, textTransform: "uppercase", fontSize: 11, color }}>
                    {score.label}
                  </div>
                )}
                {current && (
                  <div style={{ marginTop: 6, color: "#334155" }}>
                    {formatWind(current.windSpeedMph)}{" "}
                    <span style={{ opacity: 0.7 }}>
                      g {Math.round(current.windGustMph)} · {current.windDirection}
                    </span>
                  </div>
                )}
                <Link
                  to={`/spots/${spot.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    color: "#2563eb",
                    fontWeight: 500,
                    textDecoration: "underline",
                  }}
                >
                  View spot
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
