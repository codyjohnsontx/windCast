import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, LocateFixed, X } from "lucide-react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import SpotMarkerLayer, { type SpotMarkerState } from "./SpotMarkerLayer";
import VelocityLayer from "./VelocityLayer";
import ClickForecastLayer from "./ClickForecastLayer";
import ForecastTimeline, { selectedForecastHour } from "./ForecastTimeline";
import LayerDrawer from "./LayerDrawer";
import ObservationMarkerLayer from "./ObservationMarkerLayer";
import { useMapLayers } from "../../hooks/useMapLayers";
import { usePreferences } from "../../hooks/usePreferences";
import { useSpots } from "../../hooks/useSpots";
import { formatWind } from "../../utils/format";

export default function WindcastMap() {
  const { spots } = useSpots();
  const { preferences, setDefaultMapLayers, setWindParticleDensity } = usePreferences();
  const { layers, toggleLayer } = useMapLayers(preferences.defaultMapLayers);
  const didHydrateLayers = useRef(false);
  const layersRef = useRef(layers);
  const [timeline, setTimeline] = useState({ dayOffset: 0, hourOffset: 0 });
  const [layerDrawerOpen, setLayerDrawerOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<SpotMarkerState | null>(null);
  const [windStatus, setWindStatus] = useState<"loading" | "active" | "error">("loading");
  const handleWindStatus = useCallback((status: "loading" | "active" | "error") => {
    setWindStatus(status);
  }, []);
  const hourOffset = selectedForecastHour(timeline);
  const activeWindDensity =
    preferences.windParticleDensity === "off" ? null : preferences.windParticleDensity;
  const windLayerActive = layers["wind-particles"] && activeWindDensity !== null;
  const displayedWindStatus = windLayerActive ? windStatus : "off";
  layersRef.current = layers;

  useEffect(() => {
    if (!didHydrateLayers.current) {
      didHydrateLayers.current = true;
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDefaultMapLayers(layers);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [layers, setDefaultMapLayers]);

  useEffect(() => {
    return () => setDefaultMapLayers(layersRef.current);
  }, [setDefaultMapLayers]);

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
      {selectedSpot && (
        <SelectedSpotPanel state={selectedSpot} windUnit={preferences.windUnit} onClose={() => setSelectedSpot(null)} />
      )}
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
        {layers.spots && <SpotMarkerLayer hourOffset={hourOffset} onSelectSpot={setSelectedSpot} />}
        {layers.observations && <ObservationMarkerLayer />}
        <ClickForecastLayer />
        <RecenterControl triggerKey={`${spots.length}:${layers.spots}`} />
      </MapContainer>
    </>
  );
}

function SelectedSpotPanel({
  state,
  windUnit,
  onClose,
}: {
  state: SpotMarkerState;
  windUnit: ReturnType<typeof usePreferences>["preferences"]["windUnit"];
  onClose: () => void;
}) {
  return (
    <aside className="absolute bottom-28 left-3 right-3 z-[620] rounded-lg border border-ink-line bg-ink-panel/95 p-4 shadow-xl backdrop-blur sm:left-auto sm:w-80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{state.spot.name}</h2>
          <div className="mt-1 text-xs text-ink-muted">
            {state.forecastMeta?.status === "ready"
              ? `Forecast from ${state.forecastMeta.source}`
              : state.forecastMeta?.message ?? (state.error ? "Forecast unavailable" : "Checking forecast")}
          </div>
        </div>
        <button type="button" className="map-tool" onClick={onClose} aria-label="Close spot summary">
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Decision</div>
          <div className="mt-0.5 font-semibold capitalize">
            {state.loading ? "Checking" : state.score ? `${state.score.label} ${state.score.score}/100` : "Unavailable"}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Wind</div>
          <div className="mt-0.5 font-semibold">
            {state.current
              ? `${formatWind(state.current.windSpeedMph, windUnit)} g ${formatWind(state.current.windGustMph, windUnit)} ${state.current.windDirection}`
              : "—"}
          </div>
        </div>
      </div>

      {state.forecastMeta?.isFallback && (
        <div className="mt-3 rounded-md border border-score-maybe/40 bg-score-maybe/10 px-3 py-2 text-xs text-score-maybe">
          Verify this window before loading gear.
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link to={`/spots/${state.spot.id}`} className="button-primary flex-1">
          View detail
        </Link>
        <Link to={`/spots/${state.spot.id}/edit`} className="button-secondary">
          Edit
        </Link>
      </div>
    </aside>
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
      <button
        type="button"
        className="map-tool"
        onClick={() => window.dispatchEvent(new Event("windcast:recenter-map"))}
        title="Recenter saved spots"
        aria-label="Recenter map"
      >
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
