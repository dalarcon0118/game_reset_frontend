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
import { roleToScreenMap } from '@/config/routes';
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
        <RootLayout/>
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
    console.log('user: ', user);
  }, [user]);
  useEffect(() => {
    console.log(isLoading, isAuthenticated, user);
    if (!isLoading && user && isAuthenticated) {
      const targetPath = user.role ? roleToScreenMap[user.role] : '+not-found';
      console.log('User authenticated, redirecting to:', targetPath);
      router.replace(targetPath);    }
  }, [isLoading, isAuthenticated, user]);
  
  const handleBackPress = useCallback(() => {
    console.log('Back button pressed', pathname);
    if (pathname.includes('/bets_create/') || pathname.includes('/bets_list/')) {
      router.push('/lister/(tabs)');
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
    <Stack.Screen name="login" options={{ headerShown: false }} />
    <Stack.Screen name="(admin)" options={{ headerShown: false }} />
    <Stack.Screen name="lister/(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="lister/bets_create/[id]" options={{ 
      headerShown: true,
      headerTitle: 'Anotar',
      headerBackVisible: true,
      freezeOnBlur: true,
      
       }} />
    <Stack.Screen name="lister/bets_list/[id]" options={{ 
      headerShown: true,
      headerTitle: 'Lista',
      headerBackTitle: 'Atrás',
      headerBackVisible: true,
      freezeOnBlur: true,
       }} />

<Stack.Screen name="lister/bets_rules/[id]" options={{ 
      headerShown: true,
      headerTitle: 'Reglamento',
      headerBackTitle: 'Atrás',
      headerBackVisible: true,
      freezeOnBlur: true,
       }} />
    
  </Stack>
  );
}