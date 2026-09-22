import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddLocationDialog from "./AddLocationDialog.jsx";

describe("AddLocationDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <AddLocationDialog open={false} onClose={vi.fn()} onSave={vi.fn()} onPickOnMap={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("requires a name", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddLocationDialog open onClose={vi.fn()} onSave={onSave} onPickOnMap={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save landmark" }));
    expect(screen.getByText("Add a name for this landmark.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a prefilled search hit at its coordinates", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <AddLocationDialog
        open
        prefill={{ name: "New Cafe", category: "Neighborhoods", detail: "Coffee in Lawrenceville", lat: 40.46, lng: -79.96 }}
        onClose={vi.fn()}
        onSave={onSave}
        onPickOnMap={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("New Cafe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Coffee in Lawrenceville")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save landmark" }));
    expect(onSave).toHaveBeenCalledWith({
      name: "New Cafe",
      category: "Neighborhoods",
      description: "Coffee in Lawrenceville",
      lat: 40.46,
      lng: -79.96,
      coordsSource: "search",
      accessibility: {
        walking: "unknown",
        wheelchair: "unknown",
        ramps: "unknown",
        elevators: "unknown",
        restroom: "unknown",
        notes: "",
      },
      paths: [],
    });
  });

  it("lets the user select accessible path types", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddLocationDialog open onClose={vi.fn()} onSave={onSave} onPickOnMap={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Landmark name"), "Side door entrance");
    await user.click(screen.getByRole("button", { name: "Step-free" }));
    await user.click(screen.getByRole("button", { name: "Ramp" }));
    await user.click(screen.getByRole("button", { name: "Save landmark" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Side door entrance",
        paths: ["step-free", "ramp"],
      }),
    );
  });
});
