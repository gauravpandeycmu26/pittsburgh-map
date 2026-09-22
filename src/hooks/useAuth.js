import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((data) => {
        if (alive) setUser(data.user);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const signup = useCallback(async (body) => {
    setBusy(true);
    setError("");
    try {
      const data = await api.signup(body);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const login = useCallback(async (body) => {
    setBusy(true);
    setError("");
    try {
      const data = await api.login(body);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const guest = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api.guest();
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setBusy(false);
    }
  }, []);

  return { user, ready, error, busy, signup, login, guest, logout, setError };
}
