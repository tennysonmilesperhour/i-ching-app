import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/api/authClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const session = authClient.getSession();
    if (session) setUser(session.user);
    setIsLoadingAuth(false);
  }, []);

  const invalidateReadings = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['readings'] });
    queryClient.invalidateQueries({ queryKey: ['reading'] });
  }, [queryClient]);

  const signup = useCallback(async ({ email, password, displayName }) => {
    setAuthError(null);
    const session = await authClient.signup({ email, password, displayName });
    setUser(session.user);
    invalidateReadings();
    return session.user;
  }, [invalidateReadings]);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    const session = await authClient.login({ email, password });
    setUser(session.user);
    invalidateReadings();
    return session.user;
  }, [invalidateReadings]);

  const logout = useCallback(() => {
    authClient.logout();
    setUser(null);
    invalidateReadings();
  }, [invalidateReadings]);

  const updateProfile = useCallback((patch) => {
    const updated = authClient.updateProfile(patch);
    setUser(updated);
    return updated;
  }, []);

  // Legacy no-op retained for App.jsx's auth-error redirect fallback.
  const navigateToLogin = () => {
    if (typeof window !== 'undefined') window.location.assign('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isGuest: !user,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    setAuthError,
    signup,
    login,
    logout,
    updateProfile,
    navigateToLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
