import React, { useState } from 'react';
import '../config/init'; // Global side effects first
import { Stack } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { DevTools } from '../config/init';
import { AppProviders } from '../providers/AppProviders';
import { useAuthV1 } from '../features/auth/v1';
import { AuthStatus } from '../shared/auth/v1/model';
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary';
import { ErrorBoundary as SharedErrorBoundary } from '../shared/components/error_boundary';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useNavigationLogger } from '../hooks/useNavigationLogger';
import { routes } from '../config/routes';
import setings from '../config/settings';
import { logger } from '../shared/utils/logger';

// Export ErrorBoundary for Expo Router
export { GlobalErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AppProviders>
        <SharedErrorBoundary name="RootLayout">
          <RootLayoutContent />
        </SharedErrorBoundary>
      </AppProviders>
    </GlobalErrorBoundary>
  );
}

function RootLayoutContent() {
  // Ya no bloqueamos aquí basándonos en AuthModuleV1.
  // El bloqueo real ocurre en CoreInitializer (AppProviders.tsx)
  // que espera a que la infraestructura base esté lista.
  return <RootLayoutInner />;
}

function RootLayoutInner() {
  const { BackButton } = useAuthNavigation();
  //add an alert with the backend url

  // Logger para capturar todas las navegaciones (incluyendo router.push directo)
  useNavigationLogger();

  return (
    <View style={{ flex: 1 }}>
      {/*__DEV__ && <DevToolbar />*/}
      <Stack
        screenOptions={{
          headerShown: true,
          headerLeft: () => BackButton,
          freezeOnBlur: true,
        }}>
        <Stack.Screen name="login" options={routes.login.options} />
        {/* <Stack.Screen name="(admin)" options={routes.admin.options} /> */}
        <Stack.Screen name="lister" options={{ headerShown: false }} />
        <Stack.Screen name="colector" options={{ headerShown: false }} />
        <Stack.Screen name="banker" options={{ headerShown: false }} />
      </Stack>

    </View>
  );
}

export function DevToolbar() {
  const [e2eTraceId, setE2eTraceId] = useState('');

  return (
    <View style={styles.devBar}>
      <TextInput
        testID="e2e-trace-id-input"
        style={{ width: 0, height: 0, opacity: 0 }} // Hidden but interactable by Detox
        value={e2eTraceId}
        onChangeText={setE2eTraceId}
      />
      <TouchableOpacity
        onPress={() => logger.error('E2E Telemetry Test Error', { traceId: e2eTraceId || 'e2e-default-trace' })}
        style={[styles.devButton, { backgroundColor: '#c0392b' }]}
        testID="trigger-telemetry-error"
      >
        <Text style={styles.devText}>Err</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => DevTools.clearStorage()} style={styles.devButton}>
        <Text style={styles.devText}>Clear</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => DevTools.printStorage()} style={styles.devButton}>
        <Text style={styles.devText}>Keys</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => DevTools.printFullStorage()} style={styles.devButton}>
        <Text style={styles.devText}>Full</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => DevTools.clearSession()} style={styles.devButton}>
        <Text style={styles.devText}>Clear Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  devBar: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#444',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  devButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  devText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
