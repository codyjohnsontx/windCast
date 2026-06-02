import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SpotForm from "./SpotForm";

describe("SpotForm", () => {
  it("shows validation errors and prevents invalid submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SpotForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), "Bad Range");
    await user.clear(screen.getByLabelText(/ideal low/i));
    await user.type(screen.getByLabelText(/ideal low/i), "30");
    await user.clear(screen.getByLabelText(/ideal high/i));
    await user.type(screen.getByLabelText(/ideal high/i), "20");
    await user.click(screen.getByRole("button", { name: /save spot/i }));

    expect(await screen.findByText(/must be at least ideal low/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid spot", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SpotForm initialLat={28.1} initialLng={-95.2} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), "New Launch");
    await user.click(screen.getByRole("checkbox", { name: /^wing$/i }));
    await user.click(screen.getByRole("button", { name: /save spot/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: "New Launch",
      latitude: 28.1,
      longitude: -95.2,
      sportTypes: ["wing_foiling"],
    }));
  });
});
