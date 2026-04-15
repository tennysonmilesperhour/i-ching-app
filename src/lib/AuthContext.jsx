import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load public settings
    const loadSettings = async () => {
      try {
        if (base44.getPublicSettings) {
          await base44.getPublicSettings();
        }
      } catch {
        // Public settings are optional
      } finally {
        setIsLoadingPublicSettings(false);
      }
    };

    // Check authentication
    const checkAuth = async () => {
      try {
        if (base44.auth) {
          const currentUser = await base44.auth.getUser();
          setUser(currentUser);
        }
      } catch (err) {
        if (err?.type === 'user_not_registered' || err?.type === 'auth_required') {
          setAuthError(err);
        }
        // If no auth module, continue without auth
      } finally {
        setIsLoadingAuth(false);
      }
    };

    loadSettings();
    checkAuth();
  }, []);

  const navigateToLogin = () => {
    if (base44.auth?.navigateToLogin) {
      base44.auth.navigateToLogin();
    }
  };

  return (
    <AuthContext.Provider value={{ isLoadingAuth, isLoadingPublicSettings, authError, user, navigateToLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
