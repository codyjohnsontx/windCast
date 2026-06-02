import { useCallback, useEffect, useState } from "react";
import { Layers, LocateFixed } from "lucide-react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import SpotMarkerLayer from "./SpotMarkerLayer";
import VelocityLayer from "./VelocityLayer";
import ClickForecastLayer from "./ClickForecastLayer";
import ForecastTimeline, { selectedForecastHour } from "./ForecastTimeline";
import LayerDrawer from "./LayerDrawer";
import ObservationMarkerLayer from "./ObservationMarkerLayer";
import { useMapLayers } from "../../hooks/useMapLayers";
import { usePreferences } from "../../hooks/usePreferences";
import { useSpots } from "../../hooks/useSpots";

export default function WindcastMap() {
  const { spots } = useSpots();
  const { preferences, setDefaultMapLayers, setWindParticleDensity } = usePreferences();
  const { layers, toggleLayer } = useMapLayers(preferences.defaultMapLayers);
  const [timeline, setTimeline] = useState({ dayOffset: 0, hourOffset: 0 });
  const [layerDrawerOpen, setLayerDrawerOpen] = useState(false);
  const [windStatus, setWindStatus] = useState<"loading" | "active" | "error">("loading");
  const handleWindStatus = useCallback((status: "loading" | "active" | "error") => {
    setWindStatus(status);
  }, []);
  const hourOffset = selectedForecastHour(timeline);
  const activeWindDensity =
    preferences.windParticleDensity === "off" ? null : preferences.windParticleDensity;
  const windLayerActive = layers["wind-particles"] && activeWindDensity !== null;
  const displayedWindStatus = windLayerActive ? windStatus : "off";

  useEffect(() => {
    setDefaultMapLayers(layers);
  }, [layers, setDefaultMapLayers]);

  return (
    <>
      <MapToolbar
        onOpenLayers={() => setLayerDrawerOpen(true)}
        windStatus={displayedWindStatus}
        density={preferences.windParticleDensity}
      />
      <LayerDrawer
        open={layerDrawerOpen}
        layers={layers}
        windDensity={preferences.windParticleDensity}
        onClose={() => setLayerDrawerOpen(false)}
        onToggleLayer={toggleLayer}
        onWindDensityChange={setWindParticleDensity}
      />
      <ForecastTimeline value={timeline} onChange={setTimeline} />
      <MapContainer
        center={[28, -95]}
        zoom={6}
        zoomControl={false}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {windLayerActive && (
          <VelocityLayer density={activeWindDensity} onStatusChange={handleWindStatus} />
        )}
        {layers.spots && <SpotMarkerLayer hourOffset={hourOffset} />}
        {layers.observations && <ObservationMarkerLayer />}
        <ClickForecastLayer />
        <RecenterControl triggerKey={`${spots.length}:${layers.spots}`} />
      </MapContainer>
    </>
  );
}

function MapToolbar({
  onOpenLayers,
  windStatus,
  density,
}: {
  onOpenLayers: () => void;
  windStatus: "loading" | "active" | "error" | "off";
  density: string;
}) {
  return (
    <div className="absolute left-3 right-3 top-3 z-[500] flex flex-wrap items-center gap-2 rounded-lg border border-ink-line bg-ink-panel/95 p-2 shadow-lg backdrop-blur">
      <button type="button" className="button-secondary h-9" onClick={onOpenLayers}>
        <Layers size={16} /> Layers
      </button>
      <button type="button" className="map-tool" onClick={() => window.dispatchEvent(new Event("windcast:recenter-map"))} title="Recenter saved spots">
        <LocateFixed size={16} />
      </button>
      <div className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-muted">
        Wind {windStatus} · {density}
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
