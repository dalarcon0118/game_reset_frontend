import '../config/init'; // Global side effects first
import { Stack } from 'expo-router';
import { AppProviders } from '../providers/AppProviders';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary';
import { ErrorBoundary as SharedErrorBoundary } from '../shared/components/error_boundary';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { routes } from '../config/routes';

// Export ErrorBoundary for Expo Router
export { GlobalErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  const isKernelReady = useAppBootstrap();

  if (!isKernelReady) {
    return null; // Native splash screen handles visibility
  }

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

  return (
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
  );
}
