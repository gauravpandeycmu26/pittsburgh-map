import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReviewForm from "./ReviewForm.jsx";

const user = { id: "user-1", displayName: "Maya R.", guest: false };

async function fillAccessRatings(clicker) {
  await clicker.click(screen.getByRole("button", { name: "Overall access 4 stars" }));
  await clicker.click(screen.getByRole("button", { name: "Walking access 4 stars" }));
  await clicker.click(screen.getByRole("button", { name: "Wheelchair access 4 stars" }));
}

describe("ReviewForm", () => {
  it("requires a 1-5 rating", async () => {
    const clicker = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReviewForm user={user} onSubmit={onSubmit} />);

    await clicker.type(screen.getByPlaceholderText("Ramps, curb cuts, hills, elevators, restrooms…"), "A full sentence.");
    await clicker.click(screen.getByRole("button", { name: "Post access notes" }));

    expect(screen.getByText("Rate overall access, walking, and wheelchair access from 1 to 5.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a short written review", async () => {
    const clicker = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReviewForm user={user} onSubmit={onSubmit} />);

    await fillAccessRatings(clicker);
    await clicker.type(screen.getByPlaceholderText("Ramps, curb cuts, hills, elevators, restrooms…"), "short");
    await clicker.click(screen.getByRole("button", { name: "Post access notes" }));

    expect(screen.getByText("Describe ramps, hills, doors, or other barriers.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits ratings and text under the signed-in name", async () => {
    const clicker = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReviewForm user={user} onSubmit={onSubmit} />);

    expect(screen.getByText("Posting as Maya R.")).toBeInTheDocument();
    await fillAccessRatings(clicker);
    await clicker.type(
      screen.getByPlaceholderText("Ramps, curb cuts, hills, elevators, restrooms…"),
      "Worth the walk from downtown.",
    );
    await clicker.click(screen.getByRole("button", { name: "Post access notes" }));

    expect(onSubmit).toHaveBeenCalledWith({
      rating: 4,
      walking: 4,
      wheelchair: 4,
      text: "Worth the walk from downtown.",
    });
  });
});
