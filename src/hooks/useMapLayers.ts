import { useCallback, useState } from "react";
import { DEFAULT_LAYER_STATE } from "../services/layers/catalog";
import type { MapLayerId, MapLayerState } from "../services/layers/types";

export function useMapLayers(initialState: Partial<MapLayerState> = {}) {
  const [layers, setLayers] = useState<MapLayerState>(() => ({
    ...DEFAULT_LAYER_STATE,
    ...initialState,
  }));

  const setLayerEnabled = useCallback((id: MapLayerId, enabled: boolean) => {
    setLayers((prev) => ({ ...prev, [id]: enabled }));
  }, []);

  const toggleLayer = useCallback((id: MapLayerId) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return { layers, setLayerEnabled, toggleLayer };
}
