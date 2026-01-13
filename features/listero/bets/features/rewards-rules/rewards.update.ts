import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { RewardsRulesMsgType, RewardsRulesMsg } from './rewards.types';
import { Cmd } from '@/shared/core/cmd';
import { WinningService } from '@/shared/services/winning';
import { RulesService } from '@/shared/services/rules';
import { Return, ret, singleton } from '@/shared/core/return';

export const updateRewardsRules = (model: GlobalModel, msg: RewardsRulesMsg): Return<GlobalModel, RewardsRulesMsg> => {
    return match<RewardsRulesMsg, Return<GlobalModel, RewardsRulesMsg>>(msg)
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    rewards: { ...model.rewards, isLoading: true, error: null },
                },
                Cmd.task({
                    task: () => WinningService.getWinningNumber(drawId),
                    onSuccess: (rewards) => ({ type: RewardsRulesMsgType.FETCH_REWARDS_SUCCEEDED, rewards }),
                    onFailure: (err) => ({ type: RewardsRulesMsgType.FETCH_REWARDS_FAILED, error: err })
                })
            );
        })
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_SUCCEEDED }, ({ rewards }) => {
            return singleton({
                ...model,
                rewards: { data: rewards, isLoading: false, error: null },
            });
        })
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                rewards: { ...model.rewards, isLoading: false, error },
            });
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    rules: { ...model.rules, isLoading: true, error: null },
                },
                Cmd.task({
                    task: () => RulesService.getAllRulesForDraw(drawId),
                    onSuccess: (rules) => ({ type: RewardsRulesMsgType.FETCH_RULES_SUCCEEDED, rules }),
                    onFailure: (err) => ({ type: RewardsRulesMsgType.FETCH_RULES_FAILED, error: err })
                })
            );
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_SUCCEEDED }, ({ rules }) => {
            return singleton({
                ...model,
                rules: { data: rules, isLoading: false, error: null },
            });
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                rules: { ...model.rules, isLoading: false, error },
            });
        })
        .otherwise(() => singleton(model));
};
