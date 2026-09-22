import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar.jsx";
import { usePhotonSearch } from "../hooks/usePhotonSearch.js";

vi.mock("../hooks/usePhotonSearch.js", () => ({
  usePhotonSearch: vi.fn(),
}));

const places = [
  {
    id: "cmu",
    name: "Carnegie Mellon University",
    category: "Universities",
    description: "Campus in Oakland.",
  },
];

const ratings = { cmu: { count: 0, average: 0 } };
const categoriesOn = new Set(["Universities"]);

function renderSidebar(search, extraProps = {}) {
  usePhotonSearch.mockReturnValue(search);
  const onQueryChange = vi.fn();
  const onSearchSelect = vi.fn();
  const view = render(
    <Sidebar
      query={extraProps.query ?? ""}
      onQueryChange={onQueryChange}
      activeCategories={categoriesOn}
      onToggleCategory={vi.fn()}
      places={extraProps.places ?? places}
      ratings={ratings}
      selectedId={null}
      onSelectPlace={vi.fn()}
      onSearchSelect={onSearchSelect}
      open
      onClose={vi.fn()}
    />,
  );
  return { onQueryChange, onSearchSelect, ...view };
}

describe("Sidebar search", () => {
  beforeEach(() => {
    usePhotonSearch.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("sends typed text to the search query handler", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderSidebar({ hits: [], status: "idle" }, { query: "cm" });

    await user.type(screen.getByRole("textbox", { name: "Search places" }), "u");

    expect(onQueryChange).toHaveBeenCalledWith("cmu");
  });

  it("does not show city results while the remote search is idle", () => {
    renderSidebar({ hits: [], status: "idle" });
    expect(screen.queryByRole("heading", { name: "City search" })).not.toBeInTheDocument();
    expect(screen.queryByText("Searching the city…")).not.toBeInTheDocument();
  });

  it("shows a loading status while Photon is in flight", () => {
    renderSidebar({ hits: [], status: "loading" }, { query: "cathedral" });
    expect(screen.getByText("Searching the city…")).toBeInTheDocument();
  });

  it("shows an error when city search fails", () => {
    renderSidebar({ hits: [], status: "error" }, { query: "cathedral" });
    expect(screen.getByText("City search is unavailable right now.")).toBeInTheDocument();
  });

  it("lists city hits and reports the selected result", async () => {
    const user = userEvent.setup();
    const hit = {
      name: "Cathedral of Learning",
      detail: "Pittsburgh · university",
      lat: 40.4443,
      lng: -79.9532,
    };
    const { onSearchSelect } = renderSidebar({ hits: [hit], status: "done" }, { query: "cathedral" });

    expect(screen.getByRole("heading", { name: "City search" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Cathedral of Learning/i }));
    expect(onSearchSelect).toHaveBeenCalledWith(hit);
  });

  it("still shows the locally filtered place list next to city results", () => {
    renderSidebar(
      { hits: [{ name: "Forbes Ave", detail: "", lat: 40.44, lng: -79.95 }], status: "done" },
      { query: "cmu" },
    );

    expect(screen.getByRole("heading", { name: "1 place" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Carnegie Mellon University/i })).toBeInTheDocument();
  });
});
