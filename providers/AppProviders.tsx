import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { AuthProvider } from '../shared/context/auth_context';
import { BottomDrawerProvider } from '../components/ui/use_bottom_drawer';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaProvider>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={colorScheme === 'dark' ? eva.dark : eva.light}>
        <AuthProvider>
          <BottomDrawerProvider>
            {children}
          </BottomDrawerProvider>
        </AuthProvider>
        <StatusBar
          style="auto"
          translucent={Platform.OS === 'android'}
          backgroundColor="transparent"
        />
      </ApplicationProvider>
    </SafeAreaProvider>
  );
};
