import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
// Import router
import { Stack, useRouter, usePathname, ErrorBoundary as ExpoErrorBoundary, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from '../shared/navigation/navigation_service';
import { useFrameworkReady } from '../hooks/use_framework_ready';
import { useAuth, AuthProvider } from '../shared/context/auth_context';
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

// Setup EventSource for React Native
if (typeof window !== 'undefined') {
  (window as any).EventSource = EventSourcePolyfill;
} else {
  (global as any).EventSource = EventSourcePolyfill;
}

// Initialize global logger capture to ensure all console.error/warn reach the terminal
if (__DEV__) {
  logger.initGlobalCapture();
  // logger.debugStorage(); // REMOVED: To prevent log noise
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
  const colorScheme = useColorScheme() ?? 'light'; // Get color scheme
  useEffect(() => {
    // Si llegamos aquí, ocultar splash por si acaso
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  try {
    return (
      <SafeAreaProvider>
        <IconRegistry icons={EvaIconsPack} />
        <ApplicationProvider {...eva} theme={colorScheme === 'dark' ? eva.dark : eva.light}>
          <AuthProvider>
            <BottomDrawerProvider>
              <RootLayout />
            </BottomDrawerProvider>
          </AuthProvider>
          <StatusBar
            style="auto"
            translucent={Platform.OS === 'android'}
            backgroundColor="transparent"
          />
        </ApplicationProvider>
      </SafeAreaProvider>
    );
  } catch (error) {
    logger.error('CRITICAL ERROR IN RootLayoutNav', 'FATAL', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 10 }}>Error Crítico de Aplicación</Text>
        <Text style={{ color: '#ccc', textAlign: 'center', paddingHorizontal: 20 }}>{String(error)}</Text>
      </View>
    );
  }
}

// Inner component that uses TEA-based auth store
function RootLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const notificationDispatch = useNotificationStore(selectNotificationDispatch);



  useEffect(() => {
    logger.debug('Auth State updated', 'RootLayout', {
      isLoading,
      isAuthenticated,
      user: !!user,
      pathname,
      navigationReady: navigationRef.isReady(),
    });

    // Si la autenticación terminó de cargar, ocultar splash
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => { });
    }

    if (isLoading) {
      logger.debug('Skipping navigation - auth is loading', 'RootLayout');
      return;
    }

    // We don't need to wait for navigationRef.isReady() because we use expo-router's useRouter which is ready
    // if (!navigationRef.isReady() && !navFallbackTriggered) {
    //   logger.debug('Navigation not ready yet, waiting...', 'RootLayout');
    //   return;
    // }

    if (user && isAuthenticated) {
      logger.debug('User is authenticated, checking for redirection', 'RootLayout', { userRole: user.role, pathname });
      // Initialize notifications when authenticated
      notificationDispatch(FETCH_NOTIFICATIONS_REQUESTED());

      // Solo redirigir al dashboard si estamos autenticados y en páginas públicas o de login
      const isPublicOrLogin = pathname === '/login' || pathname === '/' || pathname === '/index' || pathname === '(auth)/login';

      if (isPublicOrLogin) {
        const targetPath = user.role ? roleToScreenMap[user.role] : '+not-found';
        if (targetPath) {
          logger.info(`Redirecting authenticated user to dashboard: ${targetPath}`, 'RootLayout', {
            reason: 'auth_success'
          });
          router.replace(targetPath as any);
        }
      }
    } else if (!isAuthenticated && !isLoading) {
      logger.debug('User is not authenticated', 'RootLayout', { pathname });
      // Si no estamos autenticados y estamos en la raíz, redirigir al login
      if (pathname === '/' || pathname === '/index') {
        logger.info('User not authenticated on root, redirecting to login', 'RootLayout');
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router, notificationDispatch]);

  const handleBackPress = useCallback(() => {
    logger.debug('Back button pressed', 'RootLayout', { pathname });
    if (pathname.includes('/bets_create/') || pathname.includes('/bets_list/')) {
      router.push(routes.lister.tabs.screen as any);
    } else {
      router.back();
    }
  }, [pathname, router]);

  // Synchronize navigationRef with Expo Router's navigation container
  const rootNavigation = useNavigationContainerRef();
  useEffect(() => {
    if (rootNavigation) {
      // We manually update the global navigationRef with the real navigation container
      // This is safe because navigationRef is a RefObject
      (navigationRef as any).current = rootNavigation.current;
      logger.debug('Navigation Ref synchronized', 'RootLayout');
    }
  }, [rootNavigation]);

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
