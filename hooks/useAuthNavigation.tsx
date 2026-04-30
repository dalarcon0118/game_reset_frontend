import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { CoreModule } from '../core/core_module';
import { logger } from '../shared/utils/logger';
import { Button } from '@ui-kitten/components';
import { ArrowLeft } from "lucide-react-native";
import { AuthStatus, isSessionHydrated, isFullyAuthenticated } from '../shared/auth/v1';
import { AuthModuleV1 } from '../features/auth/v1';

const log = logger.withTag('AUTH_NAVIGATION');

export function useAuthNavigation() {
  const navigationPolicy = CoreModule.useStore(state => state.model.navigationPolicy);
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const redirectInProgress = useRef(false);

  // ✅ Reactivo: useStore de TEA module es reactivo vía Context + zustand
  const authModel = AuthModuleV1.useStore(state => state.model);
  const { user, status } = authModel;

  // DEFENSIVO: isLoading espera a que hidratacion complete - solo BOOTSTRAPPING es loading
  const isLoading = status === AuthStatus.BOOTSTRAPPING;

  // 🔑 FIX: Usar predicados del dominio auth en lugar de lógica local
  const sessionHydrated = isSessionHydrated(authModel);
  const fullyAuthenticated = isFullyAuthenticated(authModel);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoading) {
      logger.debug('Skipping navigation - auth is loading', 'RootLayout', { status });
      return;
    }

    // Si NO hay sesión hidratada → redirigir a login
    if (!sessionHydrated) {
      if (pathname === '/' || pathname === '/index') {
        if (!redirectInProgress.current) {
          redirectInProgress.current = true;
          logger.info('No valid session on root, redirecting to login', 'RootLayout', {
            pathname, status, hasUser: !!user
          });
          router.replace('/login');
        }
      } else if (pathname !== '/login' && pathname !== '/register') {
        if (!redirectInProgress.current) {
          redirectInProgress.current = true;
          logger.warn('No valid session on protected route, redirecting to login', 'RootLayout', {
            pathname, status, hasUser: !!user
          });
          router.replace('/login');
        }
      }
      return;
    }

    // ✅ Sesión hidratada presente (IDLE, AUTHENTICATED, etc.) → NO redirigir a login
    // Si está completamente autenticado en root → ir al dashboard
    if (fullyAuthenticated && user && navigationPolicy) {
      if (pathname === '/' || pathname === '/index') {
        const targetPath = navigationPolicy.getHomeRoute(user);
        if (targetPath && !redirectInProgress.current) {
          redirectInProgress.current = true;
          logger.info(`Redirecting authenticated user to dashboard: ${targetPath}`, 'RootLayout');
          router.replace(targetPath as any);
        }
      } else if (!navigationPolicy.canAccess(user, pathname) && !redirectInProgress.current) {
        redirectInProgress.current = true;
        const targetPath = navigationPolicy.getHomeRoute(user);
        logger.warn(`Access denied for ${user.role} to ${pathname}. Redirecting to ${targetPath}`, 'RootLayout');
        router.replace(targetPath as any);
      }
    }
    // IDLE = sesión hidratada, PIN requerido → ir a login para confirmación
    else if (sessionHydrated && !fullyAuthenticated) {
      if (pathname !== '/login' && !redirectInProgress.current) {
        redirectInProgress.current = true;
        logger.info('PIN required, redirecting to login', 'RootLayout', { status, pathname });
        router.replace('/login');
      }
    }
  }, [isLoading, sessionHydrated, fullyAuthenticated, user, pathname, router, navigationPolicy]);

  useEffect(() => {
    if ((pathname === '/login' || pathname === '/register') && redirectInProgress.current) {
      redirectInProgress.current = false;
      logger.debug('Redirect flag reset - arrived at public route', 'RootLayout', { pathname });
    }
  }, [pathname]);

  const handleBackPress = useCallback(() => {
    logger.debug('Back button pressed', 'RootLayout', { pathname });
    const customBackPath = navigationPolicy?.getBackPath(user, pathname);
    if (customBackPath) {
      router.push(customBackPath as any);
    } else {
      router.back();
    }
  }, [pathname, router, user, navigationPolicy]);

  const BackButton = useMemo(() => {
    return (
      <Button appearance="ghost" status="basic" accessoryLeft={<ArrowLeft size={24} />} onPress={handleBackPress} />
    );
  }, [handleBackPress]);

  return { BackButton };
}