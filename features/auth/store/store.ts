// Auth Zustand store with TEA integration
import { AuthModel, AuthMsg } from './types';
import { initAuth } from './init';
import { updateAuth } from './update';
import { authSubscriptions } from './subscriptions';
import { createElmStore } from '@/shared/core/engine/engine';
import { RemoteData } from '@/shared/core/tea-utils/remote.data';
import { SessionCoordinator } from '@/shared/auth/session/session.coordinator';
import { AuthRepository } from '@/shared/repositories/auth';
import { logger } from '@/shared/utils/logger';

// Zustand store with TEA integration using the central engine
export const useAuthStore = createElmStore<AuthModel, AuthMsg>(
    initAuth, // Use init function instead of static initial model
    updateAuth,
    authSubscriptions
);

// Initialize SessionCoordinator after store creation
SessionCoordinator.initialize(
    AuthRepository,
    {} as any, // Settings will be injected or loaded
    logger.withTag('SessionCoordinator'),
    () => useAuthStore.getState().model.status as any,
    (msg) => useAuthStore.getState().dispatch(msg)
);

// Define the store type for selectors
interface AuthStore {
    model: AuthModel;
    dispatch: (msg: AuthMsg) => void;
}

// Selectors for common use cases
export const selectAuthModel = (state: AuthStore) => state.model;
export const selectAuthDispatch = (state: AuthStore) => state.dispatch;
export const selectCurrentUser = (state: AuthStore) => state.model.user;
export const selectAuthError = (state: AuthStore) => state.model.error;
export const selectAuthLoading = (state: AuthStore) => RemoteData.isLoading(state.model.loginResponse);

/**
 * Selectores Canónicos de Sesión (SSOT)
 */
export const selectSessionStatus = (state: AuthStore) => state.model.status;

/**
 * Selectores Derivados (Compatibilidad Legacy)
 */
export const selectIsAuthenticated = (state: AuthStore) =>
    state.model.status === 'AUTHENTICATED' || state.model.status === 'REFRESHING';

export const selectIsLoading = (state: AuthStore) =>
    state.model.status === 'HYDRATING' || RemoteData.isLoading(state.model.loginResponse);

export const selectIsLoggingOut = (state: AuthStore) =>
    state.model.status === 'LOGGING_OUT';
