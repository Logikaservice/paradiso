import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, refreshToken } from '../api';

const REFRESH_KEY = 'paradiso_refresh';
const TOKEN_KEY = 'paradiso_token';
const USER_KEY = 'paradiso_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((data) => {
    if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data?.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
    if (data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    applyAuth(data);
    return data;
  }, [applyAuth]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const refresh = useCallback(async () => {
    const ref = localStorage.getItem(REFRESH_KEY);
    if (!ref) return logout();
    try {
      const data = await refreshToken(ref);
      applyAuth(data);
      return data;
    } catch {
      logout();
    }
  }, [applyAuth, logout]);

  const value = { user, loading, login, logout, refresh, applyAuth };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
}
