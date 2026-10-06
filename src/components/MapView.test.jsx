import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MapView from "./MapView.jsx";

const { mapApi, setMapClick, getMapClick } = vi.hoisted(() => {
  let mapClick = null;
  return {
    mapApi: {
      setZoom: vi.fn(),
      getZoom: () => 13,
      flyTo: vi.fn(),
      getCenter: () => ({ lat: 40.4406, lng: -79.9959 }),
      invalidateSize: vi.fn(),
    },
    setMapClick: (handler) => {
      mapClick = handler;
    },
    getMapClick: () => mapClick,
  };
});

vi.mock("leaflet", () => ({
  default: {
    divIcon: (options) => options,
  },
}));

vi.mock("react-leaflet", async () => {
  const { forwardRef } = await import("react");
  return {
    MapContainer: ({ children, className }) => (
      <div data-testid="map-container" className={className}>
        {children}
      </div>
    ),
    TileLayer: () => null,
    ScaleControl: () => null,
    Popup: ({ children }) => <div>{children}</div>,
    Marker: forwardRef(({ children, eventHandlers, position }, _ref) => (
      <div data-testid="marker" data-position={`${position[0]},${position[1]}`}>
        <button type="button" onClick={() => eventHandlers?.click?.()}>
          Select pin
        </button>
        {children}
      </div>
    )),
    useMap: () => mapApi,
    useMapEvents: (handlers) => {
      setMapClick(handlers.click);
      return null;
    },
  };
});

const places = [
  {
    id: "point-state-park",
    name: "Point State Park",
    category: "Parks",
    lat: 40.4417,
    lng: -80.0103,
    description: "Fountain at the point.",
    accessibility: {
      walking: "easy",
      wheelchair: "yes",
      ramps: "yes",
      elevators: "unknown",
      restroom: "yes",
      notes: "Paved to the fountain.",
    },
  },
  {
    id: "cmu",
    name: "Carnegie Mellon University",
    category: "Universities",
    lat: 40.4433,
    lng: -79.9436,
    description: "Campus in Oakland.",
  },
];

function renderMap(props = {}) {
  return render(
    <MapView
      places={places}
      ratings={{ "point-state-park": { count: 2, average: 4 } }}
      selectedId={null}
      onSelectPlace={vi.fn()}
      focusTarget={null}
      searchHit={null}
      sheetOpen={false}
      centerRef={{ current: null }}
      onPick={vi.fn()}
      {...props}
    />,
  );
}

describe("MapView", () => {
  beforeEach(() => {
    mapApi.setZoom.mockClear();
    mapApi.flyTo.mockClear();
    setMapClick(null);
  });

  it("shows a pin and the location name for each place", () => {
    renderMap();
    const pins = screen.getAllByTestId("marker");
    expect(pins).toHaveLength(2);
    expect(pins[0]).toHaveAttribute("data-position", "40.4417,-80.0103");
    expect(screen.getByRole("heading", { name: "Point State Park" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Carnegie Mellon University" })).toBeInTheDocument();
    expect(screen.getByText("Easy walk · Wheelchair accessible")).toBeInTheDocument();
    expect(screen.getByText(/4\.0 · 2 notes/)).toBeInTheDocument();
  });

  it("zooms in and out by half a level", async () => {
    const user = userEvent.setup();
    renderMap();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(mapApi.setZoom).toHaveBeenNthCalledWith(1, 13.5, { animate: true, duration: 0.45 });
    expect(mapApi.setZoom).toHaveBeenNthCalledWith(2, 12.5, { animate: true, duration: 0.45 });
  });

  it("selects a place when its pin is clicked", async () => {
    const user = userEvent.setup();
    const onSelectPlace = vi.fn();
    renderMap({ onSelectPlace });
    const pins = screen.getAllByRole("button", { name: "Select pin" });
    await user.click(pins[1]);
    expect(onSelectPlace).toHaveBeenCalledWith(places[1]);
  });

  it("moves the map to a location when that place is focused", async () => {
    renderMap({ focusTarget: { id: 1, lat: 40.4433, lng: -79.9436, zoom: 16 } });
    await waitFor(() => {
      expect(mapApi.flyTo).toHaveBeenCalledWith([40.4433, -79.9436], 16, {
        duration: 1.05,
        easeLinearity: 0.2,
      });
    });
  });

  it("drops a new landmark pin where the map is clicked", () => {
    const onPick = vi.fn();
    renderMap({ picking: true, onPick });
    getMapClick()({ latlng: { lat: 40.45, lng: -80.01 } });
    expect(onPick).toHaveBeenCalledWith({ lat: 40.45, lng: -80.01 });
    expect(screen.getByTestId("map-container")).toHaveClass("is-picking");
  });
});
