import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { storeRegistry } from '../shared/core/engine/store_registry';
import { CoreModule } from '../core/core_module';
import { logger } from '../shared/utils/logger';
import { Button } from '@ui-kitten/components';
import { ArrowLeft } from "lucide-react-native";
import { AuthModel, AuthStatus } from '../shared/auth/v1';

const log = logger.withTag('AUTH_NAVIGATION');

export function useAuthNavigation() {
  const navigationPolicy = CoreModule.useStore(state => state.model.navigationPolicy);
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const redirectInProgress = useRef(false);

  const authStore = storeRegistry.get<{ model: AuthModel }>('AuthModuleV1');
  log.info('AuthModuleV1 store', authStore);
  const [authState, setAuthState] = useState(() => {
    if (authStore) {
      const state = authStore.getState();
      log.info('AuthModuleV1 store state',  { user: state.model.user, status: state.model.status });

      return { user: state.model.user, status: state.model.status };
    }
    return { user: null, status: AuthStatus.IDLE };
  });

  useEffect(() => {
    if (!authStore) {
      log.warn('AuthModuleV1 store not found in registry');
      return;
    }

    const unsubscribe = authStore.subscribe((state) => {
      setAuthState({ user: state.model.user, status: state.model.status });
    });

    return unsubscribe;
  }, [authStore]);

  const { user, status } = authState;
  const isLoading = status === AuthStatus.IDLE || status === AuthStatus.BOOTSTRAPPING;
  const isAuthenticated = user !== null && (
    status === AuthStatus.AUTHENTICATED || 
    status === AuthStatus.AUTHENTICATED_OFFLINE ||
    status === AuthStatus.REFRESHING
  );

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  useEffect(() => {
    if (isLoading) {
      logger.debug('Skipping navigation - auth is loading', 'RootLayout', { status });
      return;
    }

    if (!isAuthenticated && !user) {
      if (pathname === '/' || pathname === '/index') {
        if (!redirectInProgress.current) {
          redirectInProgress.current = true;
          logger.info('User not authenticated on root, redirecting to login', 'RootLayout', { pathname });
          router.replace('/login');
        }
      }
      return;
    }

    if (isAuthenticated && user && navigationPolicy) {
      if (pathname === '/' || pathname === '/index') {
        const targetPath = navigationPolicy.getHomeRoute(user);
        if (targetPath && !redirectInProgress.current) {
          redirectInProgress.current = true;
          logger.info(`Redirecting authenticated user to dashboard: ${targetPath}`, 'RootLayout');
          router.replace(targetPath as any);
        }
      } else {
        if (!navigationPolicy.canAccess(user, pathname) && !redirectInProgress.current) {
          redirectInProgress.current = true;
          const targetPath = navigationPolicy.getHomeRoute(user);
          logger.warn(`Access denied for user ${user.role} to ${pathname}. Redirecting to ${targetPath}`, 'RootLayout');
          router.replace(targetPath as any);
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router, navigationPolicy]);

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