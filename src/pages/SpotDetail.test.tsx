import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Spot } from "../types";
import type { ObservationStation, StationObservation } from "../services/observations";
import SpotDetail from "./SpotDetail";

const spot: Spot = {
  id: "texas-city-dike",
  name: "Texas City Dike",
  latitude: 29.3856,
  longitude: -94.8983,
  sportTypes: ["kiteboarding"],
  idealWindDirections: ["S"],
  unsafeWindDirections: ["N"],
  minWindMph: 13,
  idealWindMph: [16, 26],
  maxWindMph: 35,
  trustedStationIds: ["coops:8771013"],
};

const station: ObservationStation = {
  id: "coops:8771013",
  name: "Eagle Point, Galveston Bay",
  type: "tide_station",
  latitude: 29.4813,
  longitude: -94.9173,
  provider: "coops",
  sourceLabel: "CO-OPS",
  supportsWaterLevel: true,
};

const observation: StationObservation = {
  stationId: station.id,
  source: "coops",
  observedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  waterLevelFt: 1.2,
  waterLevelDatum: "MLLW",
  tideState: "rising",
};

vi.mock("../hooks/useSpots", () => ({
  useSpots: () => ({
    getSpot: (id: string | undefined) => (id === spot.id ? spot : undefined),
  }),
}));

vi.mock("../hooks/usePreferences", () => ({
  usePreferences: () => ({ preferences: { windUnit: "mph" } }),
}));

vi.mock("../hooks/useForecast", () => ({
  useForecast: () => ({
    data: [
      {
        time: new Date().toISOString(),
        windSpeedMph: 18,
        windGustMph: 24,
        windDirection: "S",
      },
    ],
    meta: {
      source: "mock",
      providerId: "mock",
      status: "ready",
      fetchedAt: new Date().toISOString(),
      isFallback: false,
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("../services/observations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/observations")>();
  return {
    ...actual,
    getObservationProvider: () => ({
      getStationsNear: vi.fn().mockResolvedValue([station]),
      getLatestObservation: vi.fn().mockResolvedValue(observation),
    }),
  };
});

describe("SpotDetail", () => {
  it("renders tide water state and station picker link", async () => {
    render(
      <MemoryRouter initialEntries={[`/spots/${spot.id}`]}>
        <Routes>
          <Route path="/spots/:id" element={<SpotDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findAllByText(/rising · 1.2 ft mllw/i)).toHaveLength(2);
    expect(screen.getByRole("link", { name: /manage/i })).toHaveAttribute(
      "href",
      `/spots/${spot.id}/stations`
    );
  });
});
