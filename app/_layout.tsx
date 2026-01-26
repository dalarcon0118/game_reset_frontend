import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'event-source-polyfill';
import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
// Import router
import { Stack, usePathname, router, ErrorBoundary as ExpoErrorBoundary } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useColorScheme } from 'react-native';
import * as eva from '@eva-design/eva'; // Import eva
import { ApplicationProvider, Button, Icon } from '@ui-kitten/components';
import { roleToScreenMap, routes } from '../config/routes';
import { ArrowLeft } from "lucide-react-native";
import { logger } from '../shared/utils/logger';
import { useNotificationStore } from '../features/notification/core/store';
import { FETCH_NOTIFICATIONS_REQUESTED } from '../features/notification/core/msg';

// Register global error handlers
if (!__DEV__) {
  // Catch unhandled promise rejections
  const originalHandler = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (error: any) => {
    logger.error('Unhandled Promise Rejection', 'GLOBAL', error);
    if (originalHandler) originalHandler(error);
  };
}

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
      <ApplicationProvider {...eva} theme={eva[colorScheme]}>
        <RootLayout />
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

  useEffect(() => {
    loadSavedUsername();
    checkLoginStatus();
  }, []);

  useEffect(() => {
    console.log('Auth State:', { isLoading, isAuthenticated, user, pathname });
    
    if (isLoading) return;

    if (user && isAuthenticated) {
      // Si estamos autenticados y estamos en la página de login, redirigir al dashboard
      if (pathname === '/login' || pathname === '/') {
        const targetPath = user.role ? roleToScreenMap[user.role] : '+not-found';
        console.log('User authenticated, redirecting to dashboard:', targetPath);
        router.replace(targetPath as any);
      }
    } else {
      // Si NO estamos autenticados y NO estamos en la página de login, redirigir al login
      if (pathname !== '/login') {
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
    <Stack screenOptions={{
      headerShown: true,
      headerLeft: () => BackButton,
      freezeOnBlur: true,

    }}>
      <Stack.Screen name={routes.login.screen} options={routes.login.options} />
      <Stack.Screen name={routes.admin.screen} options={routes.admin.options} />
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
