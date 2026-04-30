import React, { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProviderV1 } from '../features/auth/v1';
import { CoreModule } from '../core/core_module';
import { NotificationModule } from '../features/notification/core/store';
import { BottomDrawerProvider } from '../components/ui/use_bottom_drawer';
import { useCoreBootstrap } from '../hooks/useCoreBootstrap';
import { logger } from '../shared/utils/logger';

const log = logger.withTag('CORE_INITIALIZER');

interface AppProvidersProps {
  children: React.ReactNode;
}

// ✅ FIX: Timeout de seguridad para ocultar splash screen
// Si por alguna razón el splash no se oculta, lo forzamos después de 5 segundos
const SPLASH_TIMEOUT_MS = 5000;

const SplashScreenGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      log.warn('Splash screen timeout - forcing hide');
      SplashScreen.hideAsync().catch(() => {});
    }, SPLASH_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  return <>{children}</>;
};

// Prevenir que el splash screen se oculte automáticamente de forma inmediata
SplashScreen.preventAutoHideAsync().catch(() => {});

const CoreInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useCoreBootstrap();

  React.useEffect(() => {
    log.debug('Bootstrap state updated', { status });
  }, [status]);

  if (status === 'IDLE') {
    return null;
  }

  return <>{children}</>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaProvider>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={colorScheme === 'dark' ? eva.dark : eva.light}>
        <CoreModule.Provider>
          <NotificationModule.Provider>
            <CoreInitializer>
              <SplashScreenGuard>
                <AuthProviderV1>
                  <BottomDrawerProvider>
                    {children}
                  </BottomDrawerProvider>
                </AuthProviderV1>
              </SplashScreenGuard>
            </CoreInitializer>
          </NotificationModule.Provider>
        </CoreModule.Provider>
        <StatusBar
          style="auto"
          translucent={Platform.OS === 'android'}
          backgroundColor="transparent"
        />
      </ApplicationProvider>
    </SafeAreaProvider>
  );
};
