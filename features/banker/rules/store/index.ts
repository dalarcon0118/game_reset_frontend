import { createElmStore } from '../../../../shared/core/engine/engine';
import { Model, Msg } from './types';
import { update, init, subscriptions } from './update';
import { effectHandlers } from '../../../../shared/core/tea-utils/effect_handlers';
import { createLoggerMiddleware } from '../../../../shared/core/middlewares/logger.middleware';

export const useRuleStore = createElmStore<Model, Msg>(
    init,
    update,
    effectHandlers as any,
    subscriptions,
    [createLoggerMiddleware()]
);

// Selectores útiles
export const selectRules = (state: { model: Model }) => state.model.rules;
export const selectLoading = (state: { model: Model }) => state.model.loading;
export const selectSaving = (state: { model: Model }) => state.model.saving;
export const selectFormData = (state: { model: Model }) => state.model.formData;
export const selectError = (state: { model: Model }) => state.model.error;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
