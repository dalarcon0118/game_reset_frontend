import { createElmStore } from '@/shared/core/engine/engine';
import { Sub } from '@/shared/core/tea-utils';
import { RewardsModel, initialRewardsModel } from './model';
import { RewardsMsg } from './types';
import { updateRewards } from './update';

const init = () => [initialRewardsModel, null];

const subscriptions = (_model: RewardsModel) => Sub.none();

export const useRewardsStore = createElmStore<RewardsModel, RewardsMsg>({
    initial: init,
    update: updateRewards,
    subscriptions
});

// Selectors
export const selectRewardsModel = (state: { model: RewardsModel }) => state.model;
export const selectRewardsDispatch = (state: { dispatch: (msg: RewardsMsg) => void }) => state.dispatch;
