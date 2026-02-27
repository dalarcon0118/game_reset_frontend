import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { RulesModel, initialRulesModel } from './model';
import { RulesMsg } from './types';
import { updateRules } from './update';
import { Sub } from '@/shared/core/sub';

const init = () => [initialRulesModel, null];

const subscriptions = (_model: RulesModel) => Sub.none();

export const useRulesStore = createElmStore<RulesModel, RulesMsg>(
    init as any,
    updateRules as any,
    effectHandlers as any,
    subscriptions,
    [createLoggerMiddleware("RULES_FEATURE")]
);

// Selectors
export const selectRulesModel = (state: any) => state.model as RulesModel;
export const selectRulesDispatch = (state: any) => state.dispatch as (msg: RulesMsg) => void;
