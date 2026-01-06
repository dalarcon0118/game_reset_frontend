import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore, selectAuthModel, selectAuthDispatch } from '@/features/auth/store/store';
import { AuthMsgType } from '@/features/auth/store/types';
import apiClient, { setErrorHandler, ApiClientError } from '@/shared/services/ApiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (username: string, pin: string) => void;
  logout: () => void;
  checkLoginStatus: () => void;
  error: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const model = useAuthStore(selectAuthModel);
  const dispatch = useAuthStore(selectAuthDispatch);

  // Register error handler for 401/403 errors to trigger TEA logout
  useEffect(() => {
    const handler = async (error: ApiClientError, endpoint: string) => {
      if (error.status === 401 || error.status === 403) {
        console.log(`${error.status} error detected on ${endpoint}, triggering TEA logout`);
        
        // Only attempt refresh on 401
        if (error.status === 401) {
          try {
            const newToken = await apiClient.refreshAccessToken();
            if (newToken) return { retry: true, newToken };
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
          }
        }

        dispatch({ type: AuthMsgType.LOGOUT_REQUESTED });
        return null;
      }
      return null;
    };

    setErrorHandler(handler);
    return () => setErrorHandler(null);
  }, [dispatch]);

  // Initial session check
  useEffect(() => {
    dispatch({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED });
  }, [dispatch]);

  const value: AuthContextType = {
    isAuthenticated: model.isAuthenticated,
    user: model.user,
    login: (username, pin) => dispatch({ type: AuthMsgType.LOGIN_REQUESTED, username, pin }),
    logout: () => dispatch({ type: AuthMsgType.LOGOUT_REQUESTED }),
    checkLoginStatus: () => dispatch({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }),
    error: model.error,
    isLoading: model.isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}