import { useCallback, useEffect, useState } from "react";
import { MOCK_SPOTS } from "../data/mockSpots";
import type { Spot } from "../types";

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

  return { spots, getSpot, upsertSpot, removeSpot, resetToSeed };
}
