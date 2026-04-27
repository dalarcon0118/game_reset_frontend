import React, { useState, useEffect, useCallback } from 'react';
import '../config/init'; // Global side effects first
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Alert, TextInput, BackHandler, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { DevTools } from '../config/init';
import { AppProviders } from '../providers/AppProviders';
import { useAuthV1 } from '../features/auth/v1';
import { AuthStatus } from '../shared/auth/v1/model';
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary';
import { ErrorBoundary as SharedErrorBoundary } from '../shared/components/error_boundary';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useNavigationLogger } from '../hooks/useNavigationLogger';
import { routes } from '../config/routes';
import  { __DEV__TOOL } from '../config/settings';
import { logger } from '../shared/utils/logger';
import { useAppUpdate, UpdateAvailableModal } from '@/features/app-update';

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
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { BackButton } = useAuthNavigation();

  // ✅ FIX: Forzar hide del splash screen lo más temprano posible
  // Esto previene que el usuario vea el splash screen persistido
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // ✅ FIX: Manejar botón físico "Atrás" de Android
  // Esto previene que el usuario tenga que presionar "Atrás" manualmente
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handleBackPress = () => {
      const currentPath = pathname ?? '';

      // Si estamos en el dashboard (ruta raíz del tab), no hacemos nada
      // deja que el sistema maneje el cierre de la app
      if (currentPath.includes('dashboard') || currentPath === '/' || currentPath.includes('lister/(tabs)')) {
        return false;
      }

      // Para cualquier otra ruta, navegamos atrás
      router.back();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [pathname, router]);

  // Logger para capturar todas las navegaciones (incluyendo router.push directo)
  useNavigationLogger();

  // 🔄 Auto-update: verifica nuevas versiones desde GitHub Releases
  useAppUpdate();

  return (
    <View style={{ flex: 1 }}>
      <UpdateAvailableModal />
      {__DEV__TOOL && <DevToolbar />
      }
      <Stack
        screenOptions={{
          headerShown: true,
          headerLeft: () => BackButton,
          // ✅ FIX: Deshabilitar freezeOnBlur para evitar problemas de foco
          // freezeOnBlur puede causar que la pantalla no capture eventos correctamente
          freezeOnBlur: false,
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={routes.login.options} />
        {/* <Stack.Screen name="(admin)" options={routes.admin.options} /> */}
        <Stack.Screen name="lister" options={{ headerShown: false }} />
        <Stack.Screen name="colector" options={{ headerShown: false }} />
        <Stack.Screen name="banker" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
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
    top: 0,
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
