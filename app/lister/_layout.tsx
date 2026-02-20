import { Stack } from "expo-router";
import { routes } from "../../config/routes";
import { Slot } from "../../shared/core/plugins/Slot";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { initPlugins } from "../../shared/core/plugins";
import { OfflineFinancialService } from "../../shared/services/offline";
import { logger } from "../../shared/utils/logger";
import { FeatureLoader } from "../../shared/core/loader/feature_loader";
import { DashboardFeature } from "../../features/listero-dashboard/dashboard.feature";
import { BolitaFeature } from "../../features/bet-bolita/bolita.feature";
import { LoteriaFeature } from "../../features/bet-loteria/loteria.feature";
import { BetWorkspaceFeature } from "../../features/bet-workspace/workspace.feature";
import { RegistryGateway, createFeatureHandler } from "../../features/bet-workspace/gateways/composite.gateway";
import { useDashboardStore } from "../../features/listero-dashboard/core/store";

export default function AuthenticatedLayout() {
  const [isFeaturesReady, setFeaturesReady] = useState(false);

  useEffect(() => {
    // Initialize Listero-specific plugins and sync worker
    const initListero = async () => {
      try {
        // 1. Lazy Load Betting Features (Blocking)
        // We do this BEFORE any other initialization to ensure the architecture is ready
        FeatureLoader.loadFeatures([
          DashboardFeature,
          BolitaFeature,
          LoteriaFeature,
          BetWorkspaceFeature
        ]);

        // Configure Workspace Gateway (Lazy Configuration)
        if (BetWorkspaceFeature.configure) {
            // Build the Chain of Responsibility for the Workspace
            const workspaceGateway = new RegistryGateway();

            // Register Sub-Features
            workspaceGateway
                .register(createFeatureHandler(BolitaFeature))
                .register(createFeatureHandler(LoteriaFeature));

            BetWorkspaceFeature.configure({
                externalGateway: workspaceGateway
            });
        }

        setFeaturesReady(true);

        // 2. Initialize Plugins
        initPlugins(undefined, useDashboardStore);
        
        // 3. Start Sync Worker
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

  if (!isFeaturesReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      {/* Offline Sync Plugin - Toast notifications overlay via Slot system */}
      <Slot name="app.toast" />
      
      {/* Main app content */}
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={routes.lister.tabs.options} />
          <Stack.Screen name="bets/bolita/anotate" options={routes.lister.bets_create.options} />
          <Stack.Screen name="bets/bolita/list" options={routes.lister.bets_create.options} />
          <Stack.Screen name="bets/loteria/anotate" options={routes.lister.bets_list.options} />
          <Stack.Screen name="bets/loteria/list" options={routes.lister.bets_list.options} />
          <Stack.Screen name="bets/rules/index" options={routes.lister.bets_rules.options} />
          <Stack.Screen name="rewards" options={routes.lister.rewards.options} />
          <Stack.Screen name="profile" options={routes.lister.profile.options} />
          <Stack.Screen name="change_password" options={routes.lister.change_password.options} />
          <Stack.Screen name="bet_success" options={routes.lister.success.options} />
        </Stack>
      </View>
    </>
  );
}
