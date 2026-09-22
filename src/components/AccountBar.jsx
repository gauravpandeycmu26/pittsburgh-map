export default function AccountBar({ user, onLogin, onSignup, onGuest, onLogout }) {
  if (!user) {
    return (
      <div className="account-bar">
        <button className="md-text-btn" type="button" onClick={onLogin}>
          Log in
        </button>
        <button className="md-text-btn" type="button" onClick={onGuest}>
          Guest
        </button>
        <button className="md-tonal-btn" type="button" onClick={onSignup}>
          Sign up
        </button>
      </div>
    );
  }

  return (
    <div className="account-bar">
      <span className="account-name">{user.guest ? "Guest" : user.displayName}</span>
      <button className="md-text-btn" type="button" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}
