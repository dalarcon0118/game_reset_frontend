import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore, selectAuthModel, selectAuthDispatch } from '@/features/auth/store/store';
import { AuthMsgType } from '@/features/auth/store/types/messages.types';
import apiClient, { ApiClientError } from '@/shared/services/api_client';
import { logger } from '../utils/logger';
import { navigationRef } from '../navigation/navigation_service';

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

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 🧩 Integración Directa con el Store de TEA
  const model = useAuthStore(selectAuthModel);
  const dispatch = useAuthStore(selectAuthDispatch);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Expo Router Pathname
  const expoPathname = usePathname() || '';

  // Sincronizar currentPath con usePathname (más fiable en Expo Router)
  useEffect(() => {
    if (expoPathname && expoPathname !== currentPath) {
      log.debug('Path updated from usePathname', { expoPathname, oldPath: currentPath });
      setCurrentPath(expoPathname);
    }
  }, [expoPathname]);

  log.debug('AuthProvider render', { isAuthenticated: model.isAuthenticated, isLoading: model.isLoading, currentPath, expoPathname });

  const { isAuthenticated, isLoading, user, error } = model;
  
  // Simplificamos la detección de la raíz basándonos solo en expoPathname
  const isInitialRoot = expoPathname === '' || expoPathname === '/';

  const [forceHideLoading, setForceHideLoading] = useState(false);

  // Seguridad: Forzar la ocultación del loading si tarda demasiado
  useEffect(() => {
    const hideSplash = async () => {
      try {
        log.info('Hiding native splash screen from AuthProvider');
        await SplashScreen.hideAsync();
      } catch (e) {
        log.warn('Error hiding splash screen', e);
      }
    };

    // Hide splash immediately when AuthProvider mounts
    hideSplash();

    const timer = setTimeout(() => {
      if (!forceHideLoading) {
        log.warn('Force hiding loading screen after timeout');
        setForceHideLoading(true);
      }
    }, 1000); // 3 segundos es suficiente para el arranque
    return () => clearTimeout(timer);
  }, []);

  // Monitor navigation changes via navigationRef as fallback
  useEffect(() => {
    const checkPath = () => {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        const path = route?.name || '';
        // Si ya tenemos un path de usePathname, priorizamos ese si no es vacío
        if (path && path !== currentPath && !expoPathname) {
          log.debug('Navigation path changed (fallback)', { oldPath: currentPath, newPath: path, route });
          setCurrentPath(path);
        }
      }
    };

    checkPath();
    const interval = setInterval(checkPath, 200);
    return () => clearInterval(interval);
  }, [currentPath, expoPathname]);

  // 🔄 Sincronización de Errores de API con TEA
  useEffect(() => {
    const handler = async (error: ApiClientError, endpoint: string) => {
      if (error.status === 401 || error.status === 403) {
        log.info(`${error.status} error detected on ${endpoint}, triggering TEA logout`);
        
        if (error.status === 401) {
          try {
            const newToken = await apiClient.refreshAccessToken();
            if (newToken) return { retry: true, newToken };
          } catch (refreshError) {
            log.error('Token refresh error', refreshError);
          }
        }

        // Despachamos el mensaje de TEA directamente
        dispatch({ type: AuthMsgType.LOGOUT_REQUESTED });
        return null;
      }
      return null;
    };

    apiClient.setErrorHandler(handler);
    return () => apiClient.setErrorHandler(null);
  }, [dispatch]);

  // 🚀 Comandos de Inicialización de TEA
  useEffect(() => {
    dispatch({ type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED });
    dispatch({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED });
  }, [dispatch]);

  // 🧭 Control de Navegación Basado en Estado TEA - Solo redirige cuando NO está autenticado
  useEffect(() => {
    if (isLoading || !navigationRef.isReady() || isNavigating) {
      log.debug('Navigation effect skipped', { isLoading, isReady: navigationRef.isReady(), isNavigating });
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.some(route => currentPath.includes(route.replace('/', '')));

    log.debug('Navigation effect running', { currentPath, isAuthenticated, isPublicRoute });

    // Solo redirigir a login si no está autenticado y no es una ruta pública
    // Evitar redirigir si ya estamos en login para prevenir loops
    if (!isAuthenticated && !isPublicRoute && !currentPath.includes('login')) {
      log.info('User not authenticated (TEA State), redirecting to login', { currentPath, isAuthenticated, isLoading, isNavigating });
      setIsNavigating(true);
      // Use the navigation ref to navigate
      try {
        (navigationRef as any).navigate('login');
        // Reset navigation flag after a delay
        setTimeout(() => setIsNavigating(false), 1000);
      } catch (error) {
        log.error('Navigation error', error);
        setIsNavigating(false);
      }
    } else {
      log.debug('No navigation needed', { isAuthenticated, isPublicRoute, currentPath });
    }
  }, [isAuthenticated, isLoading, currentPath, isNavigating]);

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

  // 🛡️ Render Guard
  // No bloqueamos el renderizado de los hijos para evitar deadlocks con el sistema de navegación.
  // En su lugar, renderizamos los hijos y superponemos un cargador si es necesario.
  // IMPORTANTE: Solo mostramos el splash si estamos en la raíz y aún estamos cargando o no autenticados.
  // Pero si ya forzamos la ocultación (timeout), permitimos ver el contenido (que será redirigido por RootLayout).

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});