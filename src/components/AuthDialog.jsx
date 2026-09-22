import { useState } from "react";
import "./AuthDialog.css";

export default function AuthDialog({
  open,
  mode,
  busy,
  error,
  onClose,
  onLogin,
  onSignup,
  onGuest,
  onModeChange,
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    const user = isSignup
      ? await onSignup({ username, password, displayName })
      : await onLogin({ username, password });
    if (user) {
      setUsername("");
      setDisplayName("");
      setPassword("");
      onClose();
    }
  }

  return (
    <div className="dialog-root">
      <button className="dialog-scrim" type="button" aria-label="Dismiss" onClick={onClose} />
      <form className="dialog-card auth-card" onSubmit={handleSubmit}>
        <h2>{isSignup ? "Create an account" : "Log in"}</h2>
        <p>
          {isSignup
            ? "Save landmarks and access notes under your name."
            : "Log in to post access notes or add a landmark."}
        </p>
        <label className="md-field">
          <span>Username</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="maya_r"
          />
        </label>
        {isSignup ? (
          <label className="md-field">
            <span>Display name</span>
            <input
              autoComplete="nickname"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Maya R."
            />
          </label>
        ) : null}
        <label className="md-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dialog-actions">
          <button className="md-text-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="md-filled-btn" type="submit" disabled={busy}>
            {isSignup ? "Sign up" : "Log in"}
          </button>
        </div>
        <button
          className="md-text-btn auth-switch"
          type="button"
          onClick={() => onModeChange(isSignup ? "login" : "signup")}
        >
          {isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>
        <button
          className="md-text-btn auth-switch"
          type="button"
          disabled={busy}
          onClick={async () => {
            const user = await onGuest();
            if (user) {
              setUsername("");
              setDisplayName("");
              setPassword("");
              onClose();
            }
          }}
        >
          Continue as guest
        </button>
      </form>
    </div>
  );
}
