import { useEffect, useState } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { useSpots } from "../../hooks/useSpots";
import { getObservationProvider, preferTrustedStation } from "../../services/observations";
import type { ObservationStation, StationObservation } from "../../services/observations";

type StationState = {
  station: ObservationStation;
  observation: StationObservation | null;
};

export default function ObservationMarkerLayer() {
  const { spots } = useSpots();
  const [states, setStates] = useState<StationState[]>([]);

  useEffect(() => {
    let cancelled = false;
    const provider = getObservationProvider();
    Promise.all(
      spots.map(async (spot) => {
        const stations = await provider.getStationsNear(spot.latitude, spot.longitude, 75);
        const station = preferTrustedStation(stations, spot.trustedStationIds);
        if (!station) return null;
        return {
          station,
          observation: await provider.getLatestObservation(station),
        };
      })
    )
      .then((results) => {
        if (cancelled) return;
        const byId = new Map<string, StationState>();
        for (const result of results) {
          if (result) byId.set(result.station.id, result);
        }
        setStates(Array.from(byId.values()));
      })
      .catch((error) => {
        console.error("Failed to load observation map markers.", error);
        if (!cancelled) {
          setStates([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [spots]);

  return (
    <>
      {states.map(({ station, observation }) => (
        <CircleMarker
          key={station.id}
          center={[station.latitude, station.longitude]}
          radius={6}
          pathOptions={{
            color: "#e5edff",
            fillColor: station.type === "buoy" ? "#38bdf8" : "#a78bfa",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm" style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 600 }}>{station.name}</div>
              <div style={{ color: "#64748b", marginTop: 2 }}>{station.type.replace("_", " ")}</div>
              {observation ? (
                <div style={{ marginTop: 6, color: "#334155" }}>
                  {observation.windSpeedMph ?? "--"} mph
                  {observation.windGustMph !== undefined && <> g {Math.round(observation.windGustMph)}</>}
                  {observation.windDirection && <> · {observation.windDirection}</>}
                </div>
              ) : (
                <div style={{ marginTop: 6, color: "#64748b" }}>No latest observation.</div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
