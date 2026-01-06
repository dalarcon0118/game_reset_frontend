import { useEffect } from 'react';
import { Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../features/auth';
import { ActivityIndicator, View } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function Index() {
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

  return null;
}
