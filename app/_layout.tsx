import React, { useCallback, useEffect, useMemo } from 'react';
// Import router
import { Stack, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/shared/context/AuthContext';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { UserRole } from '@/data/mockData'; // Assuming UserRole is defined here
import * as eva from '@eva-design/eva'; // Import eva
import { ApplicationProvider, Button } from '@ui-kitten/components';
import { roleToScreenMap, routes } from '@/config/routes';
import { ArrowLeft } from "lucide-react-native";

// Root layout wrapper with AuthProvider
export default function RootLayoutNav() {
  useFrameworkReady();
  const colorScheme = useColorScheme() ?? 'light'; // Get color scheme

  return (
    <>
      {/* Wrap AuthProvider with ApplicationProvider */}
      <ApplicationProvider {...eva} theme={eva[colorScheme]}>
        <AuthProvider>
          <RootLayout />
          <StatusBar style="auto" />
        </AuthProvider>
      </ApplicationProvider>
    </>
  );
}

// Inner component that uses auth context
function RootLayout() {
  const { isAuthenticated, isLoading, user, checkLoginStatus } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    // console.log('user: ', user);
  }, [user]);
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

    </Stack>
  );
}
