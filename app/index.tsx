import { useEffect } from 'react';
import { Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/shared/context/AuthContext';
import { roleToScreenMap } from '@/config/routes';
import { ActivityIndicator, View } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { isAuthenticated, isLoading, user, checkLoginStatus } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    console.log('user: ', user);
  }, [user]);
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
  

  // Handle authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await checkLoginStatus();
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    
    checkAuth();
  }, [checkLoginStatus]);

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