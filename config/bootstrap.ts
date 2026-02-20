import { AppKernel } from '../shared/core/architecture/kernel';
import { restDataProvider } from '../shared/core/architecture/adapters';
import { gameResetAuthProvider } from '../features/auth/adapters/auth_provider';
import { logger } from '../shared/utils/logger';
import apiClient, { ApiClientError } from '../shared/services/api_client';
import { useAuthStore } from '../features/auth/store/store';
import { AuthMsgType } from '../features/auth/store/types';
import { RoleBasedStrategy } from '../shared/core/architecture/navigation';
import { AppRoots } from './routes';
import { EffectRegistry } from '../shared/core/effect_registry';
import { CoreEffectsModule, ResourceEffectsModule } from '../shared/core/effect_handlers';
import { AuthSubscriptionHandler } from '../features/auth/subscription_handler';
import { BetWorkspaceFeature } from '../features/bet-workspace/workspace.feature';
import { BetRegistry } from '../features/bet-workspace/core/registry';
import { StandardRegistryFeature } from '../features/bet-bolita/standard/standard.registry';
import { ParletRegistryFeature } from '../features/bet-bolita/parlet/parlet.registry';
import { CentenaRegistryFeature } from '../features/bet-bolita/centena/centena.registry';
import { LoteriaRegistryFeature } from '../features/bet-loteria/loteria.registry';
import { useBetsStore } from '../features/bet-workspace/core/store';

/**
 * Bootstraps the Application Architecture
 * This function should be called before the React application mounts.
 * It initializes the Kernel with the concrete implementations of our providers.
 */
export const bootstrapArchitecture = async (): Promise<void> => {
    logger.info('Starting Architecture Bootstrap...', 'BOOTSTRAP');

    try {
        // 0. Register Core Effects
        logger.info('Verifying Core Effects registration...', 'BOOTSTRAP');
        //EffectRegistry.register(CoreEffectsModule);
        //EffectRegistry.register(ResourceEffectsModule, { override: true })
        // Core Effects are now registered in effect_handlers.ts to avoid race conditions
        // with module-level store initialization.
        // We can optionally verify or re-register with override if needed.
        // EffectRegistry.register(CoreEffectsModule);
        // EffectRegistry.register(ResourceEffectsModule);

        // @ts-ignore
        logger.info(`Bootstrap Registry ID: ${EffectRegistry.instanceId}`, 'BOOTSTRAP');
        logger.info(`Registered keys: ${EffectRegistry.keys().join(', ')}`, 'BOOTSTRAP');

        // 0.5 Register Kernel Subscription Handlers
        logger.info('Registering Kernel Subscription Handlers...', 'BOOTSTRAP');
        AppKernel.registerSubscriptionHandler(AuthSubscriptionHandler);

        // 1. Configure Kernel
        AppKernel.configure({
            dataProvider: restDataProvider,
            authProvider: gameResetAuthProvider,
            navigationStrategy: new RoleBasedStrategy(AppRoots),
            // Resource definitions can be loaded dynamically or statically here
            resources: [
                { name: 'games' },
                { name: 'players' },
                { name: 'matches' }
            ]
        });

        // 1.5 Register Features
        logger.info('Registering Features...', 'BOOTSTRAP');

        // Initialize Bet Registry Features (Domain Logic)
        // Moved from workspace bootstrap to config to maintain agnostic principle
        BetRegistry.register(StandardRegistryFeature);
        BetRegistry.register(ParletRegistryFeature);
        BetRegistry.register(CentenaRegistryFeature);
        BetRegistry.register(LoteriaRegistryFeature);

        // Register Workspace Feature (Composite Feature) - MOVED TO LAZY LOADING
        // This feature orchestrates all betting logic
        // Inject External Features Gateway via configuration
        AppKernel.registerFeature(BetWorkspaceFeature);

        // Re-initialize the Bets Store now that the feature is registered.
        // This fixes the initialization order issue where the store module is evaluated
        // before the feature is registered in the kernel.
        useBetsStore.getState().init();

        logger.info(`Architecture bootstrapped successfully`, 'BOOTSTRAP');

        // 2. Configure Global Session Expiration Handler
        // This handles critical failures in token refresh logic (e.g. preventive refresh failure)
        apiClient.setSessionExpiredHandler(() => {
            logger.warn('Session expired signal received - Logging out', 'BOOTSTRAP');
            useAuthStore.getState().dispatch({ type: AuthMsgType.LOGOUT_REQUESTED });
        });

        // 3. Configure Global API Error Handling (Interceptor)
        // This fulfills the architectural requirement: "Kernel detects 401 and triggers logout"
        apiClient.setErrorHandler(async (error: ApiClientError, endpoint: string) => {
            // Ignore auth endpoints to prevent loops
            if (endpoint.includes('/login') || endpoint.includes('/token')) return null;

            // Check for 401 Unauthorized
            if (error.status === 401) {
                logger.warn('401 Unauthorized detected - attempting refresh or logout', 'BOOTSTRAP');

                // Try refresh token logic here
                try {
                    const newToken = await apiClient.refreshAccessToken();
                    if (newToken) {
                        logger.info('Token refreshed successfully, retrying request', 'BOOTSTRAP');
                        return { retry: true, newToken };
                    }
                } catch (refreshError: any) {
                    logger.warn(`Token refresh failed: ${refreshError.message}`, 'BOOTSTRAP');
                }

                // If refresh fails or is not possible, logout
            }
            return null;
        });
    } catch (error) {
        logger.error('Error bootstrapping architecture:', 'BOOTSTRAP', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
};
