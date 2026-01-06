// Auth Zustand store with TEA integration
import { AuthModel, AuthMsg } from './types';
import { initialAuthModel } from './initial';
import { updateAuth } from './update';
import { createElmStore } from '../../../shared/core/engine';
import { effectHandlers } from '../../../shared/core/effectHandlers';

// Zustand store with TEA integration using the central engine
export const useAuthStore = createElmStore<AuthModel, AuthMsg>(
    initialAuthModel,
    updateAuth,
    effectHandlers as any
);

// Define the store type for selectors
interface AuthStore {
    model: AuthModel;
    dispatch: (msg: AuthMsg) => void;
}

// Selectors for common use cases
export const selectAuthModel = (state: AuthStore) => state.model;
export const selectAuthDispatch = (state: AuthStore) => state.dispatch;
export const selectIsAuthenticated = (state: AuthStore) => state.model.isAuthenticated;
export const selectCurrentUser = (state: AuthStore) => state.model.user;
export const selectAuthError = (state: AuthStore) => state.model.error;
export const selectAuthLoading = (state: AuthStore) => state.model.isLoading;
