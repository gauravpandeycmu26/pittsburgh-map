import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar.jsx";

vi.mock("../hooks/usePhotonSearch.js", () => ({
  usePhotonSearch: (query) => {
    if (query.trim().toLowerCase() === "cmu") {
      return {
        hits: [{ name: "Gesling Stadium", detail: "Pittsburgh · stadium", lat: 40.442, lng: -79.944 }],
        status: "done",
      };
    }
    if (query.trim().toLowerCase() === "zzz") {
      return { hits: [], status: "error" };
    }
    return { hits: [], status: "idle" };
  },
}));

const places = [
  {
    id: "cmu",
    name: "Carnegie Mellon University",
    category: "Universities",
    description: "Campus in Oakland.",
  },
];

describe("Sidebar", () => {
  it("lists local places and their ratings", () => {
    render(
      <Sidebar
        query=""
        onQueryChange={vi.fn()}
        activeCategories={new Set(["Universities"])}
        onToggleCategory={vi.fn()}
        places={places}
        ratings={{ cmu: { count: 2, average: 4.5 } }}
        selectedId={null}
        onSelectPlace={vi.fn()}
        onSearchSelect={vi.fn()}
        open
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "1 place" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Carnegie Mellon University/ })).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("shows city-search hits and forwards a click", async () => {
    const user = userEvent.setup();
    const onSearchSelect = vi.fn();
    render(
      <Sidebar
        query="cmu"
        onQueryChange={vi.fn()}
        activeCategories={new Set(["Universities"])}
        onToggleCategory={vi.fn()}
        places={places}
        ratings={{}}
        selectedId={null}
        onSelectPlace={vi.fn()}
        onSearchSelect={onSearchSelect}
        open
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "City search" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Gesling Stadium/ }));
    expect(onSearchSelect).toHaveBeenCalledWith({
      name: "Gesling Stadium",
      detail: "Pittsburgh · stadium",
      lat: 40.442,
      lng: -79.944,
    });
  });

  it("shows a city-search error", () => {
    render(
      <Sidebar
        query="zzz"
        onQueryChange={vi.fn()}
        activeCategories={new Set(["Universities"])}
        onToggleCategory={vi.fn()}
        places={places}
        ratings={{}}
        selectedId={null}
        onSelectPlace={vi.fn()}
        onSearchSelect={vi.fn()}
        open
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("City search is unavailable right now.")).toBeInTheDocument();
  });
});
