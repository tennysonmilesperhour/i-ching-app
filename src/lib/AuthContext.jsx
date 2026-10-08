import { createContext, useCallback, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/api/authClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Session lives in localStorage, so the first paint can render real content
  // for prerender and for guests. getSession no-ops when storage is missing.
  const [user, setUser] = useState(() => authClient.getSession()?.user ?? null);
  const [isLoadingAuth] = useState(false);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const queryClient = useQueryClient();

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
