import React, { useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../shared/context/auth_context';
import { useNotificationStore, selectNotificationDispatch } from '../features/notification/core/store';
import { FETCH_NOTIFICATIONS_REQUESTED } from '../features/notification/core/msg';
import { navigationRef } from '../shared/navigation/navigation_service';
import { logger } from '../shared/utils/logger';
import { Button } from '@ui-kitten/components';
import { ArrowLeft } from "lucide-react-native";
import { AppKernel } from '../shared/core/architecture/kernel';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '(auth)/login'];

export function useAuthNavigation() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  ////const notificationDispatch = useNotificationStore(selectNotificationDispatch);
  const rootNavigation = useNavigationContainerRef();

  // 1. Navigation Reference Synchronization
  useEffect(() => {
    if (!rootNavigation?.isReady()) {
      logger.debug('Skipping navigation - navigator not ready', 'RootLayout');
      return;
    }
    if (rootNavigation) {
      (navigationRef as any).current = rootNavigation.current;
      logger.debug('Navigation Ref synchronized', 'RootLayout');
    }
  }, [rootNavigation]);

  // 2. Auth State & Redirection Logic
  useEffect(() => {
    // Hide splash screen when auth loading is done
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => { });
    }

    if (isLoading) {
      logger.debug('Skipping navigation - auth is loading', 'RootLayout');
      return;
    }

    // NEW: Block navigation during session hydration to prevent race conditions
    // The coordinator might be verifying the token; don't redirect yet.
    if (!isAuthenticated && !user && !isLoading) {
      // Check if we are in the middle of a hydration process in the store
      // We check isLoading as a proxy for HYDRATING in the base case,
      // but if the store is in a specific HYDRATING status, we should wait.
      if (isLoading) {
        logger.debug('Skipping navigation - session is hydrating', 'RootLayout');
        return;
      }
    }

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.includes(route.replace('/', '')));
    const isRoot = pathname === '/' || pathname === '/index';

    if (isAuthenticated && user) {
      // User is authenticated
      
      // Initialize notifications
      //notificationDispatch(FETCH_NOTIFICATIONS_REQUESTED());

      // Redirect to dashboard if on public/login pages or root
      if (isPublicRoute || isRoot) {
        // AppKernel decides where the user should go
        const targetPath = AppKernel.navigationStrategy.getHomeRoute(user);
        
        if (targetPath) {
          logger.info(`Redirecting authenticated user to dashboard: ${targetPath}`, 'RootLayout');
          router.replace(targetPath as any);
        }
      } else {
        // Enforce role-based access control for protected routes
        // If the user tries to access a route not allowed for their role, redirect home
        if (!AppKernel.navigationStrategy.canAccess(user, pathname)) {
          const targetPath = AppKernel.navigationStrategy.getHomeRoute(user);
          logger.warn(`Access denied for user ${user.role} to ${pathname}. Redirecting to ${targetPath}`, 'RootLayout');
          router.replace(targetPath as any);
        }
      }
    } else {
      // User is NOT authenticated
      
      // Redirect to login if on protected route
      if (!isPublicRoute) {
         logger.info('User not authenticated on protected route, redirecting to login', 'RootLayout', { pathname });
         router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // 4. Back Button Handler
  const handleBackPress = useCallback(() => {
    logger.debug('Back button pressed', 'RootLayout', { pathname });
    
    // Check if Kernel has a specific back strategy for this route/user
    const customBackPath = AppKernel.navigationStrategy.getBackPath(user, pathname);
    
    if (customBackPath) {
      router.push(customBackPath as any);
    } else {
      router.back();
    }
  }, [pathname, router, user]);

  const BackButton = useMemo(() => {
    return (
      <Button
        appearance="ghost"
        status="basic"
        accessoryLeft={<ArrowLeft size={24} />}
        onPress={handleBackPress}
      />
    );
  }, [handleBackPress]);

  return { BackButton };
}
