import { AppKernel } from '@/shared/core/architecture/kernel';
import { logger } from '../shared/utils/logger';
import { apiClient } from '../shared/services/api_client';
import { ApiClientError } from '../shared/services/api_client/api_client.errors';
import type { useAuthStore as useAuthStoreType, selectIsAuthenticated as selectIsAuthenticatedType } from '../features/auth/store/store';
import { AuthMsgType } from '../features/auth/store/types';
import { EffectRegistry, MiddlewareRegistry, effectHandlers } from '../shared/core/tea-utils';
import { AuthSubscriptionHandler } from '../features/auth/subscription_handler';
import { bootstrapKernel } from '../shared/core/architecture/bootstrap_kernel';
import { AppManifest } from './app_manifest';
import { createLoggerMiddleware } from '../shared/core/middlewares/logger.middleware';
import { createTimeIntegrityMiddleware } from '../shared/core/middlewares/time-integrity-v2.middleware';
import { elmEngine } from '@/shared/core/engine/engine_config';
/**
 * Bootstraps the Application Architecture
 * This function should be called before the React application mounts.
 * It initializes the Kernel with the concrete implementations of our providers.
 */
MiddlewareRegistry.register(createLoggerMiddleware());
MiddlewareRegistry.register(createTimeIntegrityMiddleware());
elmEngine.configure({
    effectHandlers,
    middlewares: MiddlewareRegistry.getGlobals()
});

export const bootstrapArchitecture = async (): Promise<void> => {
    logger.info('Starting Architecture Bootstrap...', 'BOOTSTRAP');

    try {

        // 0. Register Global Middlewares
        logger.info('Registering Global Middlewares...', 'BOOTSTRAP');


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
        if (AuthSubscriptionHandler) {
            AppKernel.registerSubscriptionHandler(AuthSubscriptionHandler);
            logger.info('AuthSubscriptionHandler registered successfully', 'BOOTSTRAP');
        } else {
            logger.error('AuthSubscriptionHandler is undefined! Check imports.', 'BOOTSTRAP');
        }

        // 1. Initialize Kernel from Declarative Manifest
        await bootstrapKernel(AppManifest);

        // Re-initialize the Bets Store now that the feature is registered.
        // This fixes the initialization order issue where the store module is evaluated
        // before the feature is registered in the kernel.

        logger.info(`Architecture bootstrapped successfully`, 'BOOTSTRAP');

        // 2. Configure Global Session Expiration Handler
        // This handles critical failures in token refresh logic (e.g. preventive refresh failure)
        apiClient.setSessionExpiredHandler(() => {
            const { useAuthStore, selectIsAuthenticated } = require('../features/auth/store/store') as {
                useAuthStore: typeof useAuthStoreType;
                selectIsAuthenticated: typeof selectIsAuthenticatedType;
            };
            const state = useAuthStore.getState();
            // Solo hacer logout si el usuario está autenticado
            if (selectIsAuthenticated(state)) {
                logger.warn('Session expired signal received - Logging out', 'BOOTSTRAP');
                useAuthStore.getState().dispatch({ type: AuthMsgType.LOGOUT_REQUESTED });
            } else {
                logger.debug('Session expired but user already logged out', 'BOOTSTRAP');
            }
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
