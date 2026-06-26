import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Spot } from "../types";
import type { ObservationStation, StationObservation } from "../services/observations";
import SpotStations from "./SpotStations";

const spot: Spot = {
  id: "port-aransas",
  name: "Port Aransas",
  latitude: 27.8339,
  longitude: -97.0611,
  sportTypes: ["kiteboarding"],
  idealWindDirections: ["SE"],
  unsafeWindDirections: ["NW"],
  minWindMph: 12,
  idealWindMph: [15, 25],
  maxWindMph: 32,
  trustedStationIds: ["ndbc:PTAT2"],
};

const station: ObservationStation = {
  id: "ndbc:PTAT2",
  name: "Port Aransas Wind",
  type: "wind_station",
  latitude: 27.826,
  longitude: -97.05,
  provider: "ndbc",
  sourceLabel: "NDBC",
  distanceMiles: 1.2,
  rawUrl: "https://www.ndbc.noaa.gov/data/realtime2/PTAT2.txt",
  supportsWind: true,
  supportsWaves: true,
};

const observation: StationObservation = {
  stationId: station.id,
  source: "ndbc",
  observedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  windSpeedMph: 18,
  windGustMph: 24,
  windDirection: "SE",
};

const upsertSpot = vi.fn();
let latestObservation: StationObservation | null = observation;

vi.mock("../hooks/useSpots", () => ({
  useSpots: () => ({
    getSpot: (id: string | undefined) => (id === spot.id ? spot : undefined),
    upsertSpot,
  }),
}));

vi.mock("../hooks/usePreferences", () => ({
  usePreferences: () => ({ preferences: { windUnit: "mph" } }),
}));

vi.mock("../services/observations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/observations")>();
  return {
    ...actual,
    getObservationProvider: () => ({
      getStationsNear: vi.fn().mockResolvedValue([station]),
      getLatestObservation: vi.fn().mockResolvedValue(latestObservation),
    }),
  };
});

beforeEach(() => {
  upsertSpot.mockClear();
  latestObservation = observation;
});

describe("SpotStations", () => {
  it("shows nearest station source, distance, age, and wind", async () => {
    renderPicker();

    expect(await screen.findByRole("heading", { name: /port aransas wind/i })).toBeInTheDocument();
    expect(screen.getByText("NDBC")).toBeInTheDocument();
    expect(screen.getByText(/1 mi away/i)).toBeInTheDocument();
    expect(screen.getByText(/18 mph g 24 mph SE/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /raw provider/i })).toHaveAttribute(
      "href",
      "https://www.ndbc.noaa.gov/data/realtime2/PTAT2.txt"
    );
  });

  it("selects a station as trusted", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(await screen.findByRole("button", { name: /use station/i }));

    await waitFor(() => {
      expect(upsertSpot).toHaveBeenCalledWith({ ...spot, trustedStationIds: ["ndbc:PTAT2"] });
    });
  });

  it("shows unavailable observation state without hiding station metadata", async () => {
    latestObservation = null;
    renderPicker();

    expect(await screen.findByRole("heading", { name: /port aransas wind/i })).toBeInTheDocument();
    expect(screen.getByText(/latest observation unavailable/i)).toBeInTheDocument();
  });
});

function renderPicker() {
  render(
    <MemoryRouter initialEntries={[`/spots/${spot.id}/stations`]}>
      <Routes>
        <Route path="/spots/:id/stations" element={<SpotStations />} />
        <Route path="/spots/:id" element={<div>Spot detail</div>} />
      </Routes>
    </MemoryRouter>
  );
}
