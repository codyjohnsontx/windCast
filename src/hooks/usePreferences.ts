import { useCallback, useEffect, useState } from "react";

export type UnitSystem = "mph" | "knots" | "mps";

export type Preferences = {
  windUnit: UnitSystem;
};

const STORAGE_KEY = "windcast.preferences";
const DEFAULT_PREFERENCES: Preferences = {
  windUnit: "mph",
};

function isUnitSystem(value: unknown): value is UnitSystem {
  return value === "mph" || value === "knots" || value === "mps";
}

function loadPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      windUnit: isUnitSystem(parsed.windUnit) ? parsed.windUnit : DEFAULT_PREFERENCES.windUnit,
    };
  } catch {
    return DEFAULT_PREFERENCES;
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

  return { preferences, setWindUnit };
}
