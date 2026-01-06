import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { RewardsRulesMsgType, RewardsRulesMsg } from '../types/rewardsRules.types';
import { Cmd } from '@/shared/core/cmd';
import { WinningService } from '@/shared/services/winning';
import { RulesService } from '@/shared/services/rules';

export const updateRewardsRules = (model: Model, msg: RewardsRulesMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_REQUESTED }, ({ drawId }) => {
            return [
                {
                    ...model,
                    rewards: {
                        ...model.rewards,
                        isLoading: true,
                        error: null,
                    },
                },
                Cmd.task({
                    task: () => WinningService.getWinningNumber(drawId),
                    onSuccess: (rewards) => ({ type: RewardsRulesMsgType.FETCH_REWARDS_SUCCEEDED, rewards }),
                    onFailure: (err) => ({ type: RewardsRulesMsgType.FETCH_REWARDS_FAILED, error: err })
                }),
            ] as [Model, Cmd];
        })
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_SUCCEEDED }, ({ rewards }) => {
            return [
                {
                    ...model,
                    rewards: {
                        data: rewards,
                        isLoading: false,
                        error: null,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_FAILED }, ({ error }) => {
            return [
                {
                    ...model,
                    rewards: {
                        ...model.rewards,
                        isLoading: false,
                        error,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_REQUESTED }, ({ drawId }) => {
            return [
                {
                    ...model,
                    rules: {
                        ...model.rules,
                        isLoading: true,
                        error: null,
                    },
                },
                Cmd.task({
                    task: () => RulesService.getAllRulesForDraw(drawId),
                    onSuccess: (rules) => ({ type: RewardsRulesMsgType.FETCH_RULES_SUCCEEDED, rules }),
                    onFailure: (err) => ({ type: RewardsRulesMsgType.FETCH_RULES_FAILED, error: err })
                }),
            ] as [Model, Cmd];
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_SUCCEEDED }, ({ rules }) => {
            return [
                {
                    ...model,
                    rules: {
                        data: rules,
                        isLoading: false,
                        error: null,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_FAILED }, ({ error }) => {
            return [
                {
                    ...model,
                    rules: {
                        ...model.rules,
                        isLoading: false,
                        error,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
