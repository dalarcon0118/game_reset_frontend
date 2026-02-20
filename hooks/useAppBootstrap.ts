import { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { bootstrapArchitecture } from '../config/bootstrap';
import { logger } from '../shared/utils/logger';

export function useAppBootstrap() {
  const [isKernelReady, setKernelReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Prevent splash screen from auto-hiding
        await SplashScreen.preventAutoHideAsync();
        // Initialize Architecture (Kernel, Providers, etc.)
        await bootstrapArchitecture();
        setKernelReady(true);
      } catch (e) {
        logger.error('CRITICAL: Architecture Bootstrap failed', String(e));
        // We do NOT set kernel ready if bootstrap fails, to prevent undefined behavior
        // But we might want to show an error screen instead of infinite splash
      } finally {
        // Note: We don't hide splash screen here anymore.
        // It's hidden in useAuthNavigation once auth is settled.
      }
    }

    prepare();
  }, []);

  return isKernelReady;
}
