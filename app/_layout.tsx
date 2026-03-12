import '../config/init'; // Global side effects first
import { Stack } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { DevTools } from '../config/init';
import { AppProviders } from '../providers/AppProviders';
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary';
import { ErrorBoundary as SharedErrorBoundary } from '../shared/components/error_boundary';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useNavigationLogger } from '../hooks/useNavigationLogger';
import { routes } from '../config/routes';
import setings from '../config/settings';

// Export ErrorBoundary for Expo Router
export { GlobalErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AppProviders>
        <SharedErrorBoundary name="RootLayout">
          <RootLayoutInner />
        </SharedErrorBoundary>
      </AppProviders>
    </GlobalErrorBoundary>
  );
}

function RootLayoutInner() {
  const { BackButton } = useAuthNavigation();
  //add an alert with the backend url
  
  // Logger para capturar todas las navegaciones (incluyendo router.push directo)
  useNavigationLogger();

  return (
    <View style={{ flex: 1 }}>
      {__DEV__ && <DevToolbar />}
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

function DevToolbar() {
  return (
    <View style={styles.devBar}>
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
    top: 10,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    zIndex: 9999,
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
