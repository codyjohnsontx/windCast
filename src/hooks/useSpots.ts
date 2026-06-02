import { useCallback, useEffect, useState } from "react";
import { MOCK_SPOTS } from "../data/mockSpots";
import { COMPASS_OPTIONS, SPORT_OPTIONS } from "../constants";
import type { SportType, Spot } from "../types";

const STORAGE_KEY = "windcast.spots";

function loadSpots(): Spot[] {
  if (typeof window === "undefined") return MOCK_SPOTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Spot[];
  } catch {
    // Fall through to seed.
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SPOTS));
  } catch {
    // Ignore storage failures; we'll still serve in-memory mocks.
  }
  return MOCK_SPOTS;
}

function persist(spots: Spot[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
  } catch {
    // Ignore.
  }
}

export function useSpots() {
  const [spots, setSpots] = useState<Spot[]>(() => loadSpots());

  useEffect(() => {
    persist(spots);
  }, [spots]);

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

  return { spots, getSpot, upsertSpot, removeSpot, resetToSeed, replaceSpots, exportSpots };
}

export function validateSpots(value: unknown): Spot[] {
  if (!Array.isArray(value)) throw new Error("Spot import must be an array.");
  return value.map(validateSpot);
}

function validateSpot(value: unknown): Spot {
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
    notes: typeof spot.notes === "string" && spot.notes.trim() ? spot.notes : undefined,
  };
}

function sanitizeList(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && allowed.includes(item));
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
