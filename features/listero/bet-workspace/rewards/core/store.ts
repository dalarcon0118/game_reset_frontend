import { createElmStore } from '@/shared/core/engine/engine';
import { effectHandlers } from '@/shared/core/tea-utils/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { RewardsModel, initialRewardsModel } from './model';
import { RewardsMsg } from './types';
import { updateRewards } from './update';
import { Sub } from '@/shared/core/tea-utils/sub';

const init = () => [initialRewardsModel, null];

const subscriptions = (_model: RewardsModel) => Sub.none();

export const useRewardsStore = createElmStore<RewardsModel, RewardsMsg>(
    init as any,
    updateRewards as any,
    effectHandlers as any,
    subscriptions,
    [createLoggerMiddleware("REWARDS_FEATURE")]
);

// Selectors
export const selectRewardsModel = (state: any) => state.model as RewardsModel;
export const selectRewardsDispatch = (state: any) => state.dispatch as (msg: RewardsMsg) => void;
