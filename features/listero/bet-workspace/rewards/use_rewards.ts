import { useRewardsStore, selectRewardsModel, selectRewardsDispatch } from './core/store';
import * as RewardsMsg from './core/types';

export const useRewards = () => {
    const model = useRewardsStore(selectRewardsModel);
    const dispatch = useRewardsStore(selectRewardsDispatch);

    const {
        rewards,
        rules,
        currentDrawId,
    } = model;

    const fetchRewards = (drawId: string) => dispatch(RewardsMsg.FETCH_REWARDS_REQUESTED({ drawId }));
    const fetchRules = (drawId: string) => dispatch(RewardsMsg.FETCH_RULES_REQUESTED({ drawId }));

    return {
        rewards,
        rules,
        currentDrawId,
        fetchRewards,
        fetchRules,
    };
};
