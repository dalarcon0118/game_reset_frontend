import { Stack, ErrorBoundary as ExpoErrorBoundary } from "expo-router";
import { routes } from "../../config/routes";
import { Slot } from "../../shared/core/plugins/Slot";
import { View } from "react-native";
import { useEffect } from "react";
import { initPlugins } from "../../shared/core/plugins";
import { OfflineFinancialService } from "../../shared/services/offline";
import { logger } from "../../shared/utils/logger";

export { ExpoErrorBoundary as ErrorBoundary };

export default function AuthenticatedLayout() {
  useEffect(() => {
    // Initialize Listero-specific plugins and sync worker
    const initListero = async () => {
      try {
        initPlugins();
        await OfflineFinancialService.startSyncWorker();
        logger.info('Listero environment initialized', 'ListerLayout');
      } catch (error) {
        logger.error('Error initializing Listero environment', 'ListerLayout', error);
      }
    };

    initListero();

    // Cleanup on unmount (logout or role change)
    return () => {
      OfflineFinancialService.stopSyncWorker();
      logger.info('Listero environment cleaned up', 'ListerLayout');
    };
  }, []);

  return (
    <>
      {/* Offline Sync Plugin - Toast notifications overlay via Slot system */}
      <Slot name="app.toast" />
      
      {/* Main app content */}
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={routes.lister.tabs.options} />
          <Stack.Screen name="bets_create/[id]" options={routes.lister.bets_create.options} />
          <Stack.Screen name="bets_list/[id]" options={routes.lister.bets_list.options} />
          <Stack.Screen name="bets_rules/[id]" options={routes.lister.bets_rules.options} />
          <Stack.Screen name="rewards/[id]" options={routes.lister.rewards.options} />
          <Stack.Screen name="profile" options={routes.lister.profile.options} />
          <Stack.Screen name="change_password" options={routes.lister.change_password.options} />
          <Stack.Screen name="bet_success" options={routes.lister.success.options} />
        </Stack>
      </View>
    </>
  );
}
