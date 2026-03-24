import React from 'react';
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

// Prevenir que el splash screen se oculte automáticamente de forma inmediata
SplashScreen.preventAutoHideAsync().catch(() => {});

const CoreInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bootstrapped, status } = useCoreBootstrap();
  
  React.useEffect(() => {
    log.debug('Bootstrap state updated', { bootstrapped, status });
  }, [bootstrapped, status]);

  if (!bootstrapped) {
    log.debug('Core not bootstrapped yet, but mounting children to preserve stores');
  }

  log.info('Core infrastructure ready or mounting, rendering children', { bootstrapped });
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
              <AuthProviderV1>
                <BottomDrawerProvider>
                  {children}
                </BottomDrawerProvider>
              </AuthProviderV1>
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
