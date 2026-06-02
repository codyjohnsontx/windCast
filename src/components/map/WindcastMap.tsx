import { useCallback, useEffect, useState } from "react";
import { Layers, LocateFixed, MapPin, Wind } from "lucide-react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import SpotMarkerLayer from "./SpotMarkerLayer";
import VelocityLayer from "./VelocityLayer";
import ClickForecastLayer from "./ClickForecastLayer";
import { useSpots } from "../../hooks/useSpots";

const HOUR_OPTIONS = [
  { value: 0, label: "Now" },
  { value: 3, label: "+3h" },
  { value: 6, label: "+6h" },
  { value: 12, label: "+12h" },
  { value: 24, label: "+24h" },
];

export default function WindcastMap() {
  const { spots } = useSpots();
  const [hourOffset, setHourOffset] = useState(0);
  const [showWind, setShowWind] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [windStatus, setWindStatus] = useState<"loading" | "active" | "error">("loading");
  const handleWindStatus = useCallback((status: "loading" | "active" | "error") => {
    setWindStatus(status);
  }, []);

  return (
    <>
      <MapToolbar
        hourOffset={hourOffset}
        onHourOffsetChange={setHourOffset}
        showWind={showWind}
        onShowWindChange={setShowWind}
        showSpots={showSpots}
        onShowSpotsChange={setShowSpots}
        windStatus={windStatus}
      />
      <MapContainer
        center={[28, -95]}
        zoom={6}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showWind && <VelocityLayer onStatusChange={handleWindStatus} />}
        {showSpots && <SpotMarkerLayer hourOffset={hourOffset} />}
        <ClickForecastLayer />
        <RecenterControl triggerKey={`${spots.length}:${showSpots}`} />
      </MapContainer>
    </>
  );
}

function MapToolbar({
  hourOffset,
  onHourOffsetChange,
  showWind,
  onShowWindChange,
  showSpots,
  onShowSpotsChange,
  windStatus,
}: {
  hourOffset: number;
  onHourOffsetChange: (value: number) => void;
  showWind: boolean;
  onShowWindChange: (value: boolean) => void;
  showSpots: boolean;
  onShowSpotsChange: (value: boolean) => void;
  windStatus: "loading" | "active" | "error";
}) {
  return (
    <div className="absolute left-3 right-3 top-3 z-[500] flex flex-wrap items-center gap-2 rounded-lg border border-ink-line bg-ink-panel/95 p-2 shadow-lg backdrop-blur">
      <div className="inline-flex rounded-md border border-ink-line bg-ink-base/60 p-0.5">
        {HOUR_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onHourOffsetChange(option.value)}
            className={`h-8 px-2 text-xs font-semibold rounded ${
              hourOffset === option.value ? "bg-ink-text text-ink-base" : "text-ink-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button type="button" className={showWind ? "map-tool-active" : "map-tool"} onClick={() => onShowWindChange(!showWind)} title="Toggle wind particles">
        <Wind size={16} />
      </button>
      <button type="button" className={showSpots ? "map-tool-active" : "map-tool"} onClick={() => onShowSpotsChange(!showSpots)} title="Toggle saved spots">
        <MapPin size={16} />
      </button>
      <button type="button" className="map-tool" onClick={() => window.dispatchEvent(new Event("windcast:recenter-map"))} title="Recenter saved spots">
        <LocateFixed size={16} />
      </button>
      <div className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-muted">
        <Layers size={14} />
        {showWind ? `Wind ${windStatus}` : "Wind hidden"}
      </div>
    </div>
  );
}

function RecenterControl({ triggerKey }: { triggerKey: string }) {
  const map = useMap();
  const { spots } = useSpots();

  useEffect(() => {
    const recenter = () => {
      if (spots.length === 0) {
        map.setView([28, -95], 6);
        return;
      }
      const bounds = spots.map((spot) => [spot.latitude, spot.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    };
    window.addEventListener("windcast:recenter-map", recenter);
    return () => window.removeEventListener("windcast:recenter-map", recenter);
  }, [map, spots, triggerKey]);

  return null;
}
