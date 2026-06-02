import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LAYER_STATE } from "../services/layers/catalog";
import type { MapLayerState, WindParticleDensity } from "../services/layers/types";

export type UnitSystem = "mph" | "knots" | "mps";

export type Preferences = {
  windUnit: UnitSystem;
  defaultMapLayers: MapLayerState;
  windParticleDensity: WindParticleDensity;
  forecastDays: 3 | 5 | 7;
};

const STORAGE_KEY = "windcast.preferences";

function defaultPreferences(): Preferences {
  return {
    windUnit: "mph",
    defaultMapLayers: { ...DEFAULT_LAYER_STATE },
    windParticleDensity: "light",
    forecastDays: 5,
  };
}

function isUnitSystem(value: unknown): value is UnitSystem {
  return value === "mph" || value === "knots" || value === "mps";
}

function isWindParticleDensity(value: unknown): value is WindParticleDensity {
  return value === "off" || value === "light" || value === "normal" || value === "dense";
}

function isForecastDays(value: unknown): value is 3 | 5 | 7 {
  return value === 3 || value === 5 || value === 7;
}

function sanitizeMapLayers(value: unknown): MapLayerState {
  const result = { ...DEFAULT_LAYER_STATE };
  if (!value || typeof value !== "object") return result;
  const layers = value as Record<string, unknown>;
  for (const id of Object.keys(DEFAULT_LAYER_STATE) as Array<keyof MapLayerState>) {
    if (typeof layers[id] === "boolean") {
      result[id] = layers[id];
    }
  }
  return result;
}

function loadPreferences(): Preferences {
  const defaults = defaultPreferences();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      windUnit: isUnitSystem(parsed.windUnit) ? parsed.windUnit : defaults.windUnit,
      defaultMapLayers: sanitizeMapLayers(parsed.defaultMapLayers),
      windParticleDensity: isWindParticleDensity(parsed.windParticleDensity)
        ? parsed.windParticleDensity
        : defaults.windParticleDensity,
      forecastDays: isForecastDays(parsed.forecastDays)
        ? parsed.forecastDays
        : defaults.forecastDays,
    };
  } catch {
    return defaults;
  }
}

function persist(preferences: Preferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage failures; controls still work in memory for this session.
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());

  useEffect(() => {
    persist(preferences);
  }, [preferences]);

  const setWindUnit = useCallback((windUnit: UnitSystem) => {
    setPreferences((prev) => ({ ...prev, windUnit }));
  }, []);

  const setDefaultMapLayers = useCallback((defaultMapLayers: MapLayerState) => {
    setPreferences((prev) => ({ ...prev, defaultMapLayers }));
  }, []);

  const setWindParticleDensity = useCallback((windParticleDensity: WindParticleDensity) => {
    setPreferences((prev) => ({ ...prev, windParticleDensity }));
  }, []);

  return { preferences, setDefaultMapLayers, setWindParticleDensity, setWindUnit };
}
