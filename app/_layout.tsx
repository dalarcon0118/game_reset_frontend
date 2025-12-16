import React, { useCallback, useEffect, useMemo } from 'react';
// Import router
import { Stack, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/shared/context/AuthContext';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { UserRole } from '@/data/mockData'; // Assuming UserRole is defined here
import * as eva from '@eva-design/eva'; // Import eva
import { ApplicationProvider, Button, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { roleToScreenMap, routes } from '@/config/routes';
import { ArrowLeft } from "lucide-react-native";

// Root layout wrapper with AuthProvider
export default function RootLayoutNav() {
  useFrameworkReady();
  const colorScheme = useColorScheme() ?? 'light'; // Get color scheme

  return (
    <>
      {/* Optional: Icon Registry if using Eva Icons */}
      <IconRegistry icons={EvaIconsPack} />
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
    console.log(isLoading, isAuthenticated, user);
    if (!isLoading && user && isAuthenticated) {
      const targetPath = user.role ? roleToScreenMap[user.role] : '+not-found';
      console.log('User authenticated, redirecting to:', targetPath);
      router.replace(targetPath);
    }
  }, [isLoading, isAuthenticated, user]);

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
      <Stack.Screen name={routes.lister.tabs.screen} options={routes.lister.tabs.options} />
      <Stack.Screen name={routes.lister.bets_create.screen} options={routes.lister.bets_create.options} />
      <Stack.Screen name={routes.lister.bets_list.screen} options={routes.lister.bets_list.options} />
      <Stack.Screen name={routes.lister.bets_rules.screen} options={routes.lister.bets_rules.options} />
      <Stack.Screen name={routes.lister.rewards.screen} options={routes.lister.rewards.options} />
      <Stack.Screen name={routes.colector.tabs.screen} options={routes.colector.tabs.options} />

    </Stack>
  );
}