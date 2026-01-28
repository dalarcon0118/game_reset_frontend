import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { Model, Msg } from './types';
import { update, initialState } from './update';

export const useSettingsStore = createElmStore<Model, Msg>(
    initialState,
    update,
    effectHandlers as any
);

// Selectores
export const selectUser = (state: { model: Model }) => state.model.user;
export const selectSecurity = (state: { model: Model }) => state.model.security;
export const selectPreferences = (state: { model: Model }) => state.model.preferences;
export const selectRules = (state: { model: Model }) => state.model.rules;
export const selectExpandedSections = (state: { model: Model }) => state.model.expandedSections;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
