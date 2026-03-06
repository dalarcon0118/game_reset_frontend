import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { 
  useAuthStore, 
  selectAuthDispatch, 
  selectIsAuthenticated, 
  selectIsLoading, 
  selectCurrentUser, 
  selectAuthError 
} from '@/features/auth/store/store';
import { useShallow } from 'zustand/react/shallow';
import { AuthMsgType } from '@/features/auth/store/types/messages.types';
import { logger } from '../utils/logger';

const log = logger.withTag('AUTH_CONTEXT');

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (username: string, pin: string) => void;
  logout: () => void;
  checkLoginStatus: () => void;
  loadSavedUsername: () => void;
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
  // 🧩 Integración Directa con el Store de TEA usando selectores canónicos
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const user = useAuthStore(selectCurrentUser);
  const error = useAuthStore(selectAuthError);
  
  const dispatch = useAuthStore(selectAuthDispatch);

  log.debug('AuthProvider render', { isAuthenticated, isLoading });

  // 🚀 Comandos de Inicialización de TEA
  useEffect(() => {
    dispatch({ type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED });
    dispatch({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED });
  }, [dispatch]);

  // 🛠️ Mapeo de Acciones del Contexto a Mensajes TEA
  const value = useMemo(() => ({
    isAuthenticated,
    user,
    login: (username: string, pin: string) => 
      dispatch({ type: AuthMsgType.LOGIN_REQUESTED, username, pin }),
    logout: () => 
      dispatch({ type: AuthMsgType.LOGOUT_REQUESTED }),
    checkLoginStatus: () => 
      dispatch({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED }),
    loadSavedUsername: () => 
      dispatch({ type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED }),
    error,
    isLoading,
  }), [isAuthenticated, user, error, isLoading, dispatch]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
