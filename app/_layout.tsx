import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
// Import router
import { Stack, usePathname, router, ErrorBoundary as ExpoErrorBoundary } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from '../shared/navigation/navigation_service';
import { useFrameworkReady } from '../hooks/use_framework_ready';
import { useAuth } from '../features/auth/hooks/use_auth';
import { useColorScheme } from 'react-native';
import * as eva from '@eva-design/eva'; // Import eva
import { ApplicationProvider, Button, Icon, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { BottomDrawerProvider } from '../components/ui/use_bottom_drawer';
import { roleToScreenMap, routes } from '../config/routes';
import { ArrowLeft } from "lucide-react-native";
import { logger } from '../shared/utils/logger';
import { registerReactNativeEvents } from '../shared/react-native-events';
import { useNotificationStore, selectNotificationDispatch } from '../features/notification/core/store';
import { FETCH_NOTIFICATIONS_REQUESTED } from '../features/notification/core/msg';
import { initPlugins } from '../shared/core/plugins';

// Setup EventSource for React Native
if (typeof window !== 'undefined') {
  (window as any).EventSource = EventSourcePolyfill;
} else {
  (global as any).EventSource = EventSourcePolyfill;
}

// Initialize global logger capture to ensure all console.error/warn reach the terminal
if (__DEV__) {
  logger.initGlobalCapture();
}

// Register platform specific events for TEA
registerReactNativeEvents();

// Register global error handlers
// In development, we want to log to terminal even if RedBox appears
const originalHandler = (global as any).ErrorUtils?.getGlobalHandler();
if ((global as any).ErrorUtils) {
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    // Log to terminal via our logger
    logger.error(`Global Error Caught (${isFatal ? 'Fatal' : 'Non-fatal'})`, 'FATAL', error);
    
    // Call original handler to show RedBox on phone
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Catch unhandled promise rejections
const originalUnhandledRejection = (global as any).onunhandledrejection;
(global as any).onunhandledrejection = (error: any) => {
  logger.error('Unhandled Promise Rejection', 'GLOBAL', error);
  if (originalUnhandledRejection) originalUnhandledRejection(error);
};

// Re-export ErrorBoundary for Expo Router to catch internal errors
export const ErrorBoundary = (props: any) => {
  useEffect(() => {
    logger.error('Expo Router ErrorBoundary caught an error', 'ROUTER', props.error);
  }, [props.error]);

  return <ExpoErrorBoundary {...props} />;
};

// Root layout wrapper
export default function RootLayoutNav() {
  useFrameworkReady();
  const colorScheme = useColorScheme() ?? 'light'; // Get color scheme

  return (
    <SafeAreaProvider>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva[colorScheme]}>
        <BottomDrawerProvider>
          <RootLayout />
        </BottomDrawerProvider>
        <StatusBar 
          style="auto" 
          translucent={Platform.OS === 'android'}
          backgroundColor="transparent"
        />
      </ApplicationProvider>
    </SafeAreaProvider>
  );
}

// Inner component that uses TEA-based auth store
function RootLayout() {
  const { isAuthenticated, isLoading, user, checkLoginStatus, loadSavedUsername } = useAuth();
  const pathname = usePathname();
  const notificationDispatch = useNotificationStore(selectNotificationDispatch);

  useEffect(() => {
    loadSavedUsername();
    checkLoginStatus();
    // Initialize Plugin System
    initPlugins();
  }, []);

  useEffect(() => {
    console.log('Auth State:', { isLoading, isAuthenticated, user, pathname });
    
    if (isLoading) return;

    if (user && isAuthenticated) {
      // Initialize notifications when authenticated
      notificationDispatch(FETCH_NOTIFICATIONS_REQUESTED());

      // Si estamos autenticados y estamos en la página de login, redirigir al dashboard
      if (pathname === '/login' || pathname === '/') {
        const targetPath = user.role ? roleToScreenMap[user.role] : '+not-found';
        if (targetPath && router) {
          console.log('User authenticated, redirecting to dashboard:', targetPath);
          router.replace(targetPath as any);
        }
      }
    } else {
      // Si NO estamos autenticados y NO estamos en la página de login, redirigir al login
      if (pathname !== '/login' && router) {
        console.log('User not authenticated, redirecting to login');
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, pathname]);

  const handleBackPress = useCallback(() => {
    console.log('Back button pressed', pathname);
    if (pathname.includes('/bets_create/') || pathname.includes('/bets_list/')) {
      router.push(routes.lister.tabs.screen as any);
    } else {
      router.back();
    }
  }, [pathname]);

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

  return (
    <Stack
      navigationKey={pathname} // Force re-render of stack options when pathname changes
      screenOptions={{
        headerShown: true,
        headerLeft: () => BackButton,
        freezeOnBlur: true,
      }}>
      <Stack.Screen name="login" options={routes.login.options} />
      <Stack.Screen name="(admin)" options={routes.admin.options} />
      <Stack.Screen name="lister" options={{ headerShown: false }} />
      <Stack.Screen name="colector" options={{ headerShown: false }} />
      <Stack.Screen name="banker" options={{ headerShown: false }} />

    </Stack>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});
