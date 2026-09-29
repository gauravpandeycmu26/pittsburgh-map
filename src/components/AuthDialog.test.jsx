import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AuthDialog from "./AuthDialog.jsx";

describe("AuthDialog", () => {
  it("uses admin authentication and keeps the dialog open on rejection", async () => {
    const clicker = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(null);
    const onClose = vi.fn();
    render(<AuthDialog open mode="admin" onLogin={onLogin} onClose={onClose} />);
    expect(screen.queryByRole("button", { name: "Continue as guest" })).not.toBeInTheDocument();
    await clicker.type(screen.getByLabelText("Username"), "admin_user");
    await clicker.type(screen.getByLabelText("Password"), "test-password");
    await clicker.click(screen.getByRole("button", { name: "Log in" }));
    expect(onLogin).toHaveBeenCalledWith({ username: "admin_user", password: "test-password" }, true);
    expect(onClose).not.toHaveBeenCalled();
  });

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
