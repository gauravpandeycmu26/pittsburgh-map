import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AuthDialog from "./AuthDialog.jsx";

describe("AuthDialog", () => {
  it("offers guest login without a username or password", async () => {
    const user = userEvent.setup();
    const onGuest = vi.fn().mockResolvedValue({ id: "guest-1", displayName: "Guest", guest: true });
    const onClose = vi.fn();

    render(
      <AuthDialog
        open
        mode="login"
        busy={false}
        error=""
        onClose={onClose}
        onLogin={vi.fn()}
        onSignup={vi.fn()}
        onGuest={onGuest}
        onModeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Continue as guest" }));
    expect(onGuest).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
