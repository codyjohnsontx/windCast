import { useEffect, useState } from "react";
import { Popup, useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";
import { Link } from "react-router-dom";
import { getHourlyForecastResult, type ForecastSourceMeta } from "../../services/forecast";
import { usePreferences } from "../../hooks/usePreferences";
import type { ForecastHour, Spot } from "../../types";
import { formatWind } from "../../utils/format";

function ephemeralSpotAt(lat: number, lng: number): Spot {
  const id = `pin:${lat.toFixed(2)}:${lng.toFixed(2)}`;
  return {
    id,
    name: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
    latitude: lat,
    longitude: lng,
    sportTypes: [],
    idealWindDirections: [],
    unsafeWindDirections: [],
    minWindMph: 0,
    idealWindMph: [0, 100],
    maxWindMph: 100,
  };
}

export default function ClickForecastLayer() {
  const { preferences } = usePreferences();
  const [latlng, setLatLng] = useState<LatLng | null>(null);
  const [hour, setHour] = useState<ForecastHour | null>(null);
  const [meta, setMeta] = useState<ForecastSourceMeta | null>(null);
  const [loading, setLoading] = useState(false);

  useMapEvents({
    click(event) {
      setLatLng(event.latlng);
      setHour(null);
      setMeta(null);
      setLoading(true);
    },
  });

  useEffect(() => {
    if (!latlng) return;
    const controller = new AbortController();
    getHourlyForecastResult(ephemeralSpotAt(latlng.lat, latlng.lng), 1, {
      signal: controller.signal,
    })
      .then((result) => {
        setHour(result.hours[0] ?? null);
        setMeta(result.meta);
        setLoading(false);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [latlng]);

  if (!latlng) return null;

  return (
    <Popup position={latlng} eventHandlers={{ remove: () => setLatLng(null) }}>
      <div className="text-sm" style={{ minWidth: 180 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {latlng.lat.toFixed(2)}, {latlng.lng.toFixed(2)}
        </div>
        {loading && <div style={{ marginTop: 6, color: "#64748b" }}>Loading…</div>}
        {!loading && hour && (
          <div style={{ marginTop: 6, color: "#334155" }}>
            {formatWind(hour.windSpeedMph, preferences.windUnit)}{" "}
            <span style={{ opacity: 0.7 }}>
              g {formatWind(hour.windGustMph, preferences.windUnit)} · {hour.windDirection}
            </span>
            {hour.rainChance !== undefined && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Rain {Math.round(hour.rainChance * 100)}%
              </div>
            )}
            {meta?.isFallback && (
              <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>
                {meta.source}
              </div>
            )}
          </div>
        )}
        {!loading && !hour && (
          <div style={{ marginTop: 6, color: "#64748b" }}>No forecast available.</div>
        )}
        <Link
          to={`/spots/new?lat=${latlng.lat.toFixed(5)}&lng=${latlng.lng.toFixed(5)}`}
          style={{
            display: "inline-block",
            marginTop: 8,
            color: "#2563eb",
            fontWeight: 500,
            textDecoration: "underline",
          }}
        >
          Save this spot
        </Link>
      </div>
    </Popup>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
