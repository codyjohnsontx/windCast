import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_SPOTS } from "../data/mockSpots";
import { COMPASS_OPTIONS, SPORT_OPTIONS } from "../constants";
import type { SportType, Spot, SpotEnvironment } from "../types";

const STORAGE_KEY = "windcast.spots";

export type StorageIssue = {
  type: "read" | "write" | "recovered";
  message: string;
};

type LoadSpotsResult = {
  spots: Spot[];
  issue: StorageIssue | null;
};

function loadSpots(): LoadSpotsResult {
  if (typeof window === "undefined") return { spots: MOCK_SPOTS, issue: null };
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      spots: MOCK_SPOTS,
      issue: { type: "read", message: "Saved spots could not be read. Sample spots are shown in memory." },
    };
  }
  if (!raw) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SPOTS));
    } catch {
      return {
        spots: MOCK_SPOTS,
        issue: { type: "write", message: "Saved spots could not be persisted. Export a backup before closing." },
      };
    }
    return { spots: MOCK_SPOTS, issue: null };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        spots: MOCK_SPOTS,
        issue: { type: "recovered", message: "Saved spot data was not an array, so sample spots are shown in memory." },
      };
    }
    const validSpots = parsed.flatMap((item) => {
      try {
        return [validateSpot(item)];
      } catch {
        return [];
      }
    });
    if (parsed.length === 0) {
      return { spots: [], issue: null };
    }
    if (validSpots.length) {
      return {
        spots: validSpots,
        issue: validSpots.length === parsed.length
          ? null
          : { type: "recovered", message: "Some saved spots were invalid and were skipped." },
      };
    }
    return {
      spots: MOCK_SPOTS,
      issue: { type: "recovered", message: "Saved spots were invalid, so sample spots are shown in memory." },
    };
  } catch {
    return {
      spots: MOCK_SPOTS,
      issue: { type: "read", message: "Saved spot data could not be read. It was preserved in storage; export or reset from Settings." },
    };
  }
}

function persist(spots: Spot[]): StorageIssue | null {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
    return null;
  } catch {
    return { type: "write", message: "Saved spots could not be persisted. Export a backup before closing." };
  }
}

export function useSpots() {
  const [initial] = useState<LoadSpotsResult>(() => loadSpots());
  const [spots, setSpots] = useState<Spot[]>(initial.spots);
  const [storageIssue, setStorageIssue] = useState<StorageIssue | null>(initial.issue);
  const didHydrate = useRef(false);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }
    setStorageIssue(persist(spots));
  }, [spots]);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const next = loadSpots();
      setSpots(next.spots);
      setStorageIssue(next.issue);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const getSpot = useCallback(
    (id: string | undefined) => (id ? spots.find((s) => s.id === id) : undefined),
    [spots]
  );

  const upsertSpot = useCallback((spot: Spot) => {
    setSpots((prev) => {
      const idx = prev.findIndex((s) => s.id === spot.id);
      if (idx === -1) return [...prev, spot];
      const next = prev.slice();
      next[idx] = spot;
      return next;
    });
  }, []);

  const removeSpot = useCallback((id: string) => {
    setSpots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const resetToSeed = useCallback(() => {
    setSpots(MOCK_SPOTS);
  }, []);

  const replaceSpots = useCallback((nextSpots: Spot[]) => {
    setSpots(validateSpots(nextSpots));
  }, []);

  const exportSpots = useCallback(() => JSON.stringify(spots, null, 2), [spots]);

  return { spots, storageIssue, getSpot, upsertSpot, removeSpot, resetToSeed, replaceSpots, exportSpots };
}

export function validateSpots(value: unknown): Spot[] {
  if (!Array.isArray(value)) throw new Error("Spot import must be an array.");
  return value.map(validateSpot);
}

export function validateSpot(value: unknown): Spot {
  if (!value || typeof value !== "object") throw new Error("Every spot must be an object.");
  const spot = value as Partial<Spot>;
  const sportValues = SPORT_OPTIONS.map((option) => option.value);

  if (!spot.id || typeof spot.id !== "string") throw new Error("Every spot needs an id.");
  if (!spot.name || typeof spot.name !== "string") throw new Error("Every spot needs a name.");
  if (!isLat(spot.latitude)) throw new Error(`${spot.name} has an invalid latitude.`);
  if (!isLng(spot.longitude)) throw new Error(`${spot.name} has an invalid longitude.`);
  if (!isNumber(spot.minWindMph) || !isNumber(spot.maxWindMph)) throw new Error(`${spot.name} has invalid wind limits.`);
  if (!Array.isArray(spot.idealWindMph) || spot.idealWindMph.length !== 2) throw new Error(`${spot.name} needs an ideal wind range.`);
  if (!spot.idealWindMph.every(isNumber)) throw new Error(`${spot.name} has an invalid ideal wind range.`);
  if (spot.minWindMph > spot.idealWindMph[0] || spot.idealWindMph[0] > spot.idealWindMph[1] || spot.idealWindMph[1] > spot.maxWindMph) {
    throw new Error(`${spot.name} has wind values out of order.`);
  }

  return {
    id: spot.id,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    sportTypes: sanitizeList(spot.sportTypes, sportValues) as SportType[],
    idealWindDirections: sanitizeList(spot.idealWindDirections, COMPASS_OPTIONS),
    unsafeWindDirections: sanitizeList(spot.unsafeWindDirections, COMPASS_OPTIONS),
    minWindMph: spot.minWindMph,
    idealWindMph: [spot.idealWindMph[0], spot.idealWindMph[1]],
    maxWindMph: spot.maxWindMph,
    environment: sanitizeEnvironment(spot.environment, spot.id),
    trustedStationIds: sanitizeStringList(spot.trustedStationIds),
    notes: typeof spot.notes === "string" && spot.notes.trim() ? spot.notes : undefined,
  };
}

function sanitizeList(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && allowed.includes(item));
}

function sanitizeStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  return list.length ? list : undefined;
}

function sanitizeEnvironment(value: unknown, id: string): SpotEnvironment {
  if (value === "coastal" || value === "inland") return value;
  return id === "lake-travis" ? "inland" : "coastal";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isLat(value: unknown): value is number {
  return isNumber(value) && value >= -90 && value <= 90;
}

function isLng(value: unknown): value is number {
  return isNumber(value) && value >= -180 && value <= 180;
}
