import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

vi.mock("./components/MapView.jsx", () => ({
  default: () => <div data-testid="map" />,
}));

vi.mock("./hooks/usePhotonSearch.js", () => ({
  usePhotonSearch: (query) => {
    if (query.trim().toLowerCase() === "newcafe") {
      return {
        hits: [{ name: "Brand New Cafe", detail: "Lawrenceville", lat: 40.467, lng: -79.96 }],
        status: "done",
      };
    }
    return { hits: [], status: "idle" };
  },
}));

vi.mock("./lib/api.js", async () => {
  const { places } = await vi.importActual("./data/places.js");
  const { seedReviews } = await vi.importActual("./data/seedReviews.js");
  const { pathsFor, placeAccessibility, UNKNOWN_ACCESS } = await vi.importActual("./data/accessibility.js");

  const state = {
    user: null,
    places: [],
    reviews: {},
  };

  function catalogPlaces() {
    return places.map((place) => ({
      ...place,
      paths: pathsFor(place),
      accessibility: { ...UNKNOWN_ACCESS, ...placeAccessibility[place.id] },
    }));
  }

  function ratingsMap() {
    const ratings = {};
    for (const [placeId, list] of Object.entries(state.reviews)) {
      if (!list.length) continue;
      ratings[placeId] = {
        count: list.length,
        average: list.reduce((sum, review) => sum + review.rating, 0) / list.length,
      };
    }
    return ratings;
  }

  function resetApi() {
    state.user = null;
    state.places = catalogPlaces();
    state.reviews = structuredClone(seedReviews);
  }

  resetApi();

  return {
    resetApi,
    api: {
      me: async () => ({ user: state.user }),
      signup: async (body) => {
        state.user = {
          id: "user-1",
          username: body.username,
          displayName: body.displayName || body.username,
          guest: false,
        };
        return { user: state.user };
      },
      login: async (body) => {
        state.user = { id: "user-1", username: body.username, displayName: body.username, guest: false };
        return { user: state.user };
      },
      guest: async () => {
        state.user = { id: "guest-1", username: "guest_test", displayName: "Guest", guest: true };
        return { user: state.user };
      },
      logout: async () => {
        state.user = null;
        return { ok: true };
      },
      getPlaces: async () => ({ places: state.places, ratings: ratingsMap() }),
      createPlace: async (body) => {
        const place = {
          id: `custom-${state.places.length + 1}`,
          name: body.name,
          category: body.category,
          description: body.description,
          lat: body.lat,
          lng: body.lng,
          custom: true,
          paths: body.paths ?? [],
          accessibility: body.accessibility,
        };
        state.places = [...state.places, place];
        return { place };
      },
      getReviews: async (placeId) => ({ reviews: state.reviews[placeId] ?? [] }),
      createReview: async (placeId, body) => {
        const review = {
          id: `review-${Date.now()}`,
          placeId,
          userId: state.user?.id,
          author: state.user?.guest ? "Guest" : state.user?.displayName,
          rating: body.rating,
          walking: body.walking,
          wheelchair: body.wheelchair,
          text: body.text,
          createdAt: Date.now(),
          seeded: false,
        };
        state.reviews[placeId] = [review, ...(state.reviews[placeId] ?? [])];
        return { review };
      },
      deleteReview: async (reviewId) => {
        for (const placeId of Object.keys(state.reviews)) {
          state.reviews[placeId] = state.reviews[placeId].filter((review) => review.id !== reviewId);
        }
        return { ok: true };
      },
    },
  };
});

const { resetApi } = await import("./lib/api.js");

async function placesReady() {
  await screen.findByRole("heading", { name: "27 places" });
}

describe("App", () => {
  beforeEach(() => {
    resetApi();
  });

  it("filters the place list when the user searches", async () => {
    const user = userEvent.setup();
    render(<App />);
    await placesReady();

    await user.type(screen.getByPlaceholderText("Search parks, CMU, bridges…"), "cmu");

    const list = screen.getByRole("heading", { name: /place/ }).closest("section");
    expect(within(list).getByRole("button", { name: /Carnegie Mellon University/ })).toBeInTheDocument();
    expect(within(list).queryByRole("button", { name: /Point State Park/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 places" })).toBeInTheDocument();
  });

  it("opens access notes and path types when a location is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await placesReady();

    await user.click(screen.getByRole("button", { name: /Point State Park/ }));

    const sheet = screen.getByRole("region", { name: "Point State Park" });
    expect(within(sheet).getByText(/Paved all the way to the fountain/)).toBeInTheDocument();
    expect(within(sheet).getByRole("heading", { name: "Log in to add notes" })).toBeInTheDocument();
    expect(within(sheet).getByText("Easy walk")).toBeInTheDocument();
    expect(within(sheet).getByText("Step-free")).toBeInTheDocument();
    expect(within(sheet).getByText("Paved sidewalk")).toBeInTheDocument();
  });

  it("lets a guest post a stored access rating and comment", async () => {
    const user = userEvent.setup();
    render(<App />);
    await placesReady();

    await user.click(screen.getByRole("button", { name: "Guest" }));
    await screen.findByRole("button", { name: "Log out" });

    await user.click(screen.getByRole("button", { name: /PPG Place/ }));
    const sheet = await screen.findByRole("region", { name: "PPG Place" });
    expect(within(sheet).getByRole("heading", { name: "No access notes yet" })).toBeInTheDocument();
    expect(within(sheet).getByText("Posting as Guest")).toBeInTheDocument();

    await user.click(within(sheet).getByRole("button", { name: "Overall access 5 stars" }));
    await user.click(within(sheet).getByRole("button", { name: "Walking access 5 stars" }));
    await user.click(within(sheet).getByRole("button", { name: "Wheelchair access 5 stars" }));
    await user.type(
      within(sheet).getByPlaceholderText("Ramps, curb cuts, hills, elevators, restrooms…"),
      "The courtyard is a great lunch spot.",
    );
    await user.click(within(sheet).getByRole("button", { name: "Post access notes" }));

    await waitFor(() => {
      expect(within(sheet).getByText("The courtyard is a great lunch spot.")).toBeInTheDocument();
    });
    expect(within(sheet).getByText("5.0 · 1 note")).toBeInTheDocument();
  });

  it("adds a location after guest login", async () => {
    const user = userEvent.setup();
    render(<App />);
    await placesReady();

    await user.click(screen.getByRole("button", { name: "Guest" }));
    await screen.findByRole("button", { name: "Log out" });

    await user.click(screen.getByRole("button", { name: "Add a landmark" }));
    await user.type(screen.getByPlaceholderText("Landmark name"), "Test Cafe");
    await user.type(screen.getByPlaceholderText("Hills, doors, surface…"), "A made-up coffee shop.");
    await user.click(screen.getByRole("button", { name: "Step-free" }));
    await user.click(screen.getByRole("button", { name: "Save landmark" }));

    expect(await screen.findByRole("heading", { name: "28 places" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Test Cafe" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No access notes yet" })).toBeInTheDocument();
    expect(screen.getByText("Step-free")).toBeInTheDocument();
  });

  it("treats an unknown city-search hit as a place you can add", async () => {
    const user = userEvent.setup();
    render(<App />);
    await placesReady();

    await user.click(screen.getByRole("button", { name: "Guest" }));
    await screen.findByRole("button", { name: "Log out" });

    await user.type(screen.getByPlaceholderText("Search parks, CMU, bridges…"), "newcafe");
    await user.click(screen.getByRole("button", { name: /Brand New Cafe/ }));

    expect(screen.getByRole("heading", { name: "Not on the map yet" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add this landmark" }));
    expect(screen.getByRole("heading", { name: "Add a landmark" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Brand New Cafe")).toBeInTheDocument();
  });
});
