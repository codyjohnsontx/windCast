import { X } from "lucide-react";
import { MAP_LAYERS } from "../../services/layers/catalog";
import type { MapLayerId, MapLayerState, WindParticleDensity } from "../../services/layers/types";

const CATEGORY_LABELS = {
  planning: "Planning",
  wind: "Wind",
  observations: "Observations",
  weather: "Weather",
  marine: "Marine",
};

const DENSITIES: WindParticleDensity[] = ["light", "normal", "dense"];

type Props = {
  open: boolean;
  layers: MapLayerState;
  windDensity: WindParticleDensity;
  onClose: () => void;
  onToggleLayer: (id: MapLayerId) => void;
  onWindDensityChange: (density: WindParticleDensity) => void;
};

export default function LayerDrawer({
  open,
  layers,
  windDensity,
  onClose,
  onToggleLayer,
  onWindDensityChange,
}: Props) {
  if (!open) return null;

  const categories = Array.from(new Set(MAP_LAYERS.map((layer) => layer.category)));

  return (
    <aside className="absolute right-3 top-16 z-[650] max-h-[calc(100%-7rem)] w-[min(360px,calc(100%-1.5rem))] overflow-auto rounded-lg border border-ink-line bg-ink-panel/95 p-3 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Map layers</h2>
        <button type="button" className="map-tool" onClick={onClose} aria-label="Close layers">
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 space-y-4">
        {categories.map((category) => (
          <section key={category}>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-muted">
              {CATEGORY_LABELS[category]}
            </div>
            <div className="space-y-2">
              {MAP_LAYERS.filter((layer) => layer.category === category).map((layer) => (
                <label
                  key={layer.id}
                  className={`flex items-start gap-3 rounded-md border border-ink-line bg-ink-base/40 p-3 ${
                    layer.disabledReason ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-score-good"
                    checked={layers[layer.id]}
                    disabled={Boolean(layer.disabledReason)}
                    onChange={() => onToggleLayer(layer.id)}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{layer.label}</span>
                    <span className="block text-xs text-ink-muted">{layer.description}</span>
                    {layer.disabledReason && (
                      <span className="mt-1 block text-xs text-score-poor">{layer.disabledReason}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-4 border-t border-ink-line pt-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-muted">Wind density</div>
        <div className="inline-flex rounded-md border border-ink-line bg-ink-base/40 p-0.5">
          {DENSITIES.map((density) => (
            <button
              key={density}
              type="button"
              onClick={() => onWindDensityChange(density)}
              className={`h-8 px-3 text-xs font-semibold capitalize rounded ${
                windDensity === density ? "bg-ink-text text-ink-base" : "text-ink-muted"
              }`}
            >
              {density}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
