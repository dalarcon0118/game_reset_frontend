import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '@/data/mockData';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { LoginService } from '@/shared/services/auth/LoginService';
import apiClient, { setErrorHandler, ApiClientError } from '@/shared/services/ApiClient';
import { router } from 'expo-router';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  checkLoginStatus: () => Promise<any>;
  error: any;
  isLoading: boolean;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: async () => { },
  checkLoginStatus: async () => { },
  isLoading: false,
  error: null,
  isLoggingOut: false
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loginService = LoginService();
  const [login, loginData, loginLoading, loginError] = useDataFetch(loginService.login);
  const [checkLoginStatus, userData, statusLoading] = useDataFetch(loginService.checkLoginStatus);
  const [logout] = useDataFetch(loginService.logout);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading true to prevent premature redirect
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      console.log('Logging out...');
      // Intentar avisar al backend (opcional, no importa si falla)
      try {
        await logout();
      } catch (e) {
        console.warn('Backend logout failed or session already invalid', e);
      }
      
      // Limpiar estado local SIEMPRE
      setUser(null);
      apiClient.setAuthToken(null);
      
      // Redirigir al login
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout]);

  // Register error handler for 401/403 errors
  useEffect(() => {
    const handler = async (error: ApiClientError, endpoint: string, options: RequestInit) => {
      // 401 is unauthorized (expired/invalid token)
      // 403 is forbidden (valid token but no permissions, or sometimes session issues)
      if (error.status === 401 || error.status === 403) {
        console.log(`${error.status} error detected on ${endpoint}`);

        // Only attempt refresh on 401
        if (error.status === 401) {
          console.log('Attempting token refresh...');
          try {
            const newToken = await apiClient.refreshAccessToken();
            if (newToken) {
              console.log('Token refreshed successfully, signaling retry');
              return { retry: true, newToken };
            }
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
          }
        }

        // If we reach here, it's a 403 or a 401 that couldn't be refreshed
        console.log('Session is invalid or refresh failed, logging out');
        await handleLogout();
        return null;
      }
      return null;
    };

    setErrorHandler(handler);

    return () => {
      setErrorHandler(null);
    };
  }, [handleLogout]);

  // Handle login data changes
  useEffect(() => {
    if (loginData) {
      setUser(loginData);
    }
  }, [loginData]);

  // Handle user data changes from status check
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Combined loading state
  useEffect(() => {
    // Update loading state if we are performing a login
    if (loginLoading) {
      setIsLoading(true);
    } 
    // Only set global loading for status check if we don't have a user yet
    // This prevents the app from flashing a loading screen during background refreshes
    else if (statusLoading && user === null) {
      setIsLoading(true);
    }
    // If nothing is loading, ensure global loading is off
    else if (!loginLoading && !statusLoading) {
      setIsLoading(false);
    }
  }, [loginLoading, statusLoading, user]);

  // Initial session check
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log('Initializing session...');
        const result = await checkLoginStatus();
        if (!result) {
          console.log('No active session found during init');
          // No llamamos a handleLogout aquí para evitar bucles si no hay token,
          // simplemente dejamos que RootLayout redirija a login.
        }
      } catch (e) {
        console.error('Failed to initialize session:', e);
        await handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, []);



  return (
    <AuthContext.Provider value={{
      checkLoginStatus,
      isAuthenticated: user !== null,
      user,
      login,
      logout: handleLogout,
      error: loginError,
      isLoading,
      isLoggingOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}