import { Stack, usePathname, router } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/shared/context/AuthContext";
import { routes } from "@/config/routes";

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={routes.banker.tabs.options} />
      <Stack.Screen name={routes.banker.agency_details.screen} options={routes.banker.agency_details.options} />
      <Stack.Screen name={routes.banker.reports_form.screen} options={routes.banker.reports_form.options} />
      <Stack.Screen name={routes.banker.rules.screen} options={routes.banker.rules.options} />
      <Stack.Screen name={routes.banker.settings.screen} options={routes.banker.settings.options} />
    </Stack>
  );
}
