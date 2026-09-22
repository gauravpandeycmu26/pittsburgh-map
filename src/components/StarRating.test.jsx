import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StarRating from "./StarRating.jsx";

describe("StarRating", () => {
  it("lets the user pick 1 to 5 stars", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Rating 3 stars" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not render buttons in read-only mode", () => {
    render(<StarRating value={4.5} readOnly label="Average rating" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Average rating" })).toBeInTheDocument();
  });
});
