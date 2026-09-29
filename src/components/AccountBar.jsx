import { useEffect, useRef, useState } from "react";

export default function AccountBar({ user, onLogin, onSignup, onGuest, onLogout, onAdminLogin }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function dismiss(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function choose(action) {
    setOpen(false);
    triggerRef.current?.focus();
    action?.();
  }

  return (
    <div className="account-control" ref={containerRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={triggerRef}
        className="md-tonal-btn account-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="account-options"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="material-symbols-outlined" aria-hidden="true">account_circle</span>
        Account
        <span className="material-symbols-outlined" aria-hidden="true">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="account-menu" id="account-options" role="group" aria-label="Account options">
          {user ? (
            <>
              <p className="account-name">{user.guest ? "Guest" : user.displayName}{user.admin ? " · Admin" : ""}</p>
              <button className="md-text-btn" type="button" onClick={() => choose(onLogout)}>Log out</button>
            </>
          ) : (
            <>
              <button className="md-text-btn" type="button" onClick={() => choose(onLogin)}>Log in</button>
              <button className="md-tonal-btn" type="button" onClick={() => choose(onSignup)}>Sign up</button>
              <button className="md-text-btn" type="button" onClick={() => choose(onGuest)}>Guest</button>
              <button className="md-text-btn" type="button" onClick={() => choose(onAdminLogin)}>Admin login</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
