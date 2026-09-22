import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PlaceDetails from "./PlaceDetails.jsx";

const park = {
  id: "point-state-park",
  name: "Point State Park",
  category: "Parks",
  description: "Where the rivers meet.",
  paths: ["step-free", "sidewalk", "curb-cut"],
};

describe("PlaceDetails", () => {
  it("shows existing reviews, averages, and path types", () => {
    render(
      <PlaceDetails
        selection={{ kind: "place", place: park }}
        reviews={[
          { id: "1", author: "Maya R.", rating: 5, walking: 5, wheelchair: 5, text: "Best fountain in town.", createdAt: 2 },
          { id: "2", author: "Chris T.", rating: 3, walking: 4, wheelchair: 3, text: "Windy but pretty.", createdAt: 1 },
        ]}
        onClose={vi.fn()}
        onAddReview={vi.fn()}
        onAddLocation={vi.fn()}
        onNeedAuth={vi.fn()}
        onGuest={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Point State Park" })).toBeInTheDocument();
    expect(screen.getByText("4.0 · 2 notes")).toBeInTheDocument();
    expect(screen.getByText("Best fountain in town.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Log in to add notes" })).toBeInTheDocument();
    expect(screen.getByText("Easy walk")).toBeInTheDocument();
    expect(screen.getByText("Step-free")).toBeInTheDocument();
    expect(screen.getByText("Paved sidewalk")).toBeInTheDocument();
    expect(screen.getByText("Curb cuts")).toBeInTheDocument();
  });

  it("shows an empty state when a saved place has no reviews", () => {
    render(
      <PlaceDetails
        selection={{ kind: "place", place: park }}
        reviews={[]}
        onClose={vi.fn()}
        onAddReview={vi.fn()}
        onAddLocation={vi.fn()}
        onNeedAuth={vi.fn()}
        onGuest={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "No access notes yet" })).toBeInTheDocument();
    expect(screen.getByText("We have a short access snapshot. Add what you found on the ground.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue as guest" })).toBeInTheDocument();
  });

  it("lets a signed-in user write access notes", () => {
    render(
      <PlaceDetails
        selection={{ kind: "place", place: park }}
        reviews={[]}
        user={{ id: "user-1", displayName: "Maya R.", guest: false }}
        onClose={vi.fn()}
        onAddReview={vi.fn()}
        onAddLocation={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Share access notes" })).toBeInTheDocument();
    expect(screen.getByText("Posting as Maya R.")).toBeInTheDocument();
  });

  it("asks a signed-in user to add a city-search place that is not on the map", async () => {
    const clicker = userEvent.setup();
    const onAddLocation = vi.fn();
    const prospect = { name: "New Cafe", category: "Landmarks", description: "Pittsburgh", lat: 40.45, lng: -80 };

    render(
      <PlaceDetails
        selection={{ kind: "prospect", place: prospect }}
        reviews={[]}
        user={{ id: "user-1", displayName: "Maya R.", guest: false }}
        onClose={vi.fn()}
        onAddReview={vi.fn()}
        onAddLocation={onAddLocation}
      />,
    );

    expect(screen.getByRole("heading", { name: "Not on the map yet" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Share access notes" })).not.toBeInTheDocument();
    await clicker.click(screen.getByRole("button", { name: "Add this landmark" }));
    expect(onAddLocation).toHaveBeenCalledWith(prospect);
  });
});
