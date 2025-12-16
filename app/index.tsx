import { useEffect } from 'react';
import { Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/shared/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { isAuthenticated, isLoading, user, checkLoginStatus } = useAuth();
  // Handle splash screen
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };

    setTimeout(hideSplash, 1000);
  }, []);

  // Handle user-based navigation

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return null;
}