import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import * as authService from '../api/authService.js';
import { setOnAuthFailure } from '../api/axiosClient.js';
import { AUTH_TOKEN_STORAGE_KEY } from '../utils/constants.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while restoring auth on page load
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  // Restore authentication state on first load (e.g. after a page refresh)
  // by validating whatever token is in storage against GET /auth/me.
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .fetchCurrentUser()
      .then((restoredUser) => setUser(restoredUser))
      .catch(() => clearAuth())
      .finally(() => setIsLoading(false));
  }, [clearAuth]);

  // If any protected API call comes back 401 (expired/invalid token), clear
  // auth state and send the user back to the login page.
  useEffect(() => {
    setOnAuthFailure(() => {
      clearAuth();
      navigate('/login', { replace: true });
    });
  }, [clearAuth, navigate]);

  const login = useCallback(async (email, password) => {
    setError(null);
    const { token, user: loggedInUser } = await authService.login(email, password);
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async ({ name, email, phone, password }) => {
    setError(null);
    const { token, user: newUser } = await authService.register({ name, email, phone, password });
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login', { replace: true });
  }, [clearAuth, navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      setError,
      login,
      register,
      logout,
    }),
    [user, isLoading, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
