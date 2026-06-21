import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("../hooks/useSpots", () => ({
  useSpots: () => ({ spots: [] }),
}));

describe("Dashboard", () => {
  it("shows useful onboarding actions when there are no saved spots", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/no saved spots yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add spot/i })).toHaveAttribute("href", "/spots/new");
    expect(screen.getByRole("link", { name: /use map/i })).toHaveAttribute("href", "/map");
    expect(screen.getByRole("link", { name: /import spots/i })).toHaveAttribute("href", "/settings");
  });
});
