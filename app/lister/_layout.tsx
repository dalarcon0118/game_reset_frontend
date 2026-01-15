import { Stack, ErrorBoundary } from "expo-router";
import { routes } from "../../config/routes";
import { SyncManager } from "../../shared/components/sync_manager";
import { View } from "react-native";

export { ErrorBoundary };

export default function AuthenticatedLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={routes.lister.tabs.options} />
        <Stack.Screen name="bets_create/[id]" options={routes.lister.bets_create.options} />
        <Stack.Screen name="bets_list/[id]" options={routes.lister.bets_list.options} />
        <Stack.Screen name="bets_rules/[id]" options={routes.lister.bets_rules.options} />
        <Stack.Screen name="rewards/[id]" options={routes.lister.rewards.options} />
      </Stack>
      <SyncManager />
    </View>
  );
}
  