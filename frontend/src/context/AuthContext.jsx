import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'mc_token';

async function apiFetch(path, opts = {}) {
  const { headers, ...restOpts } = opts;
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...restOpts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true); // resolves after initial auth check

  /* ── Persist token ── */
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else       localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  /* ── On mount: restore session from stored token ── */
  useEffect(() => {
    const restore = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) { setLoading(false); return; }

      try {
        const data = await apiFetch('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setUser(data.user);
        setToken(storedToken);
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  /* ── Helpers ── */
  const authFetch = useCallback(async (path, opts = {}) => {
    if (!token) throw new Error('Not authenticated');
    return apiFetch(path, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
    });
  }, [token]);

  /* ── Register ── */
  const register = useCallback(async ({ name, email, password }) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  /* ── Login ── */
  const login = useCallback(async ({ email, password }) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  /* ── Logout ── */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  /* ── Forgot password ── */
  const forgotPassword = useCallback(async (email) => {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }, []);

  /* ── Reset password ── */
  const resetPassword = useCallback(async (token, password) => {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }, []);

  /* ── Update user settings ── */
  const updateSettings = useCallback(async (settings) => {
    const data = await authFetch('/auth/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    setUser(prev => ({ ...prev, settings: data.settings }));
    return data;
  }, [authFetch]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated,
      register, login, logout,
      forgotPassword, resetPassword,
      updateSettings, authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
