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
      <Stack.Screen name="(tabs)" options={routes.colector.tabs.options} />
      <Stack.Screen name={routes.colector.details.screen} options={routes.colector.details.options} />
      <Stack.Screen name={routes.colector.reports_form.screen} options={routes.colector.reports_form.options} />
      <Stack.Screen name={routes.colector.update_rule.screen} options={routes.colector.update_rule.options} />
      <Stack.Screen name={routes.colector.node_rule.screen} options={routes.colector.node_rule.options} />

    </Stack>
  );
}
