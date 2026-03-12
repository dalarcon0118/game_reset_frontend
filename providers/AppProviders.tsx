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
import { BottomDrawerProvider } from '../components/ui/use_bottom_drawer';
import { useCoreBootstrap } from '../hooks/useCoreBootstrap';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Prevenir que el splash screen se oculte automáticamente de forma inmediata
SplashScreen.preventAutoHideAsync().catch(() => {});

const CoreInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bootstrapped } = useCoreBootstrap();
  
  if (!bootstrapped) {
    return null; // Mantiene el splash screen activo
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
          <CoreInitializer>
            <AuthProviderV1>
              <BottomDrawerProvider>
                {children}
              </BottomDrawerProvider>
            </AuthProviderV1>
          </CoreInitializer>
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
