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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle login data changes
  useEffect(() => {
    console.log("loginData: ", loginData);
    if (loginData) {
      setUser(loginData);
    }
  }, [loginData]);

  // Handle user data changes from status check
  useEffect(() => {
    console.log("userData: ", userData);
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Combined loading state
  useEffect(() => {
    setIsLoading(loginLoading || statusLoading);
  }, [loginLoading, statusLoading]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      router.replace('/login');
      await logout();
      setUser(null);
      
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout]);

  // Register error handler for 401 errors
  useEffect(() => {
    const handler = async (error: ApiClientError, endpoint: string, options: RequestInit) => {
      if (error.status === 401) {
        console.log('401 error detected, attempting token refresh');

        try {
          const newToken = await apiClient.refreshAccessToken();
          if (newToken) {
            console.log('Token refreshed successfully, signaling retry');
            // Return signal to retry with new token
            return { retry: true, newToken };
          } else {
            // Refresh failed, logout
            console.log('Token refresh failed, logging out');
            await handleLogout();
            return null;
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          // Refresh failed, logout
          await handleLogout();
          return null;
        }
      }
      return null;
    };

    setErrorHandler(handler);

    return () => {
      setErrorHandler(null);
    };
  }, [handleLogout]);

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