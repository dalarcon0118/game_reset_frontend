import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effectHandlers';
import { Model, Msg } from './types';
import { update, initialState } from './update';

export const useRuleStore = createElmStore<Model, Msg>(
    initialState,
    update,
    effectHandlers as any
);

// Selectores útiles
export const selectRules = (state: { model: Model }) => state.model.rules;
export const selectLoading = (state: { model: Model }) => state.model.loading;
export const selectSaving = (state: { model: Model }) => state.model.saving;
export const selectFormData = (state: { model: Model }) => state.model.formData;
export const selectError = (state: { model: Model }) => state.model.error;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
