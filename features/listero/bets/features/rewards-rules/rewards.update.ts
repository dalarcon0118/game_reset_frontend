import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { RewardsRulesMsgType, RewardsRulesMsg } from './rewards.types';
import { Cmd } from '@/shared/core/cmd';
import { WinningService } from '@/shared/services/winning';
import { RulesService } from '@/shared/services/rules';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('REWARDS_RULES_UPDATE');

export const updateRewardsRules = (model: GlobalModel, msg: RewardsRulesMsg): Return<GlobalModel, RewardsRulesMsg> => {
    return match<RewardsRulesMsg, Return<GlobalModel, RewardsRulesMsg>>(msg)
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    rewards: { status: RemoteData.loading() },
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
                rewards: { status: RemoteData.success(rewards) },
            });
        })
        .with({ type: RewardsRulesMsgType.FETCH_REWARDS_FAILED }, ({ error }) => {
            const status = (error as any)?.status;
            const is404 = status === 404;
            log.debug('Fetch failed', { status, is404 });
            
            // We avoid spreading the error object directly because Error properties (message, stack, status) 
            // are often not enumerable and would be lost.
            const errorData = is404 
                ? { status: 404, isPublished: false, message: 'Números no publicados' }
                : error;

            return singleton({
                ...model,
                rewards: { status: RemoteData.failure(errorData) },
            });
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_REQUESTED }, ({ drawId }) => {
            log.debug('FETCH_RULES_REQUESTED', { drawId });
            return ret(
                {
                    ...model,
                    rules: { status: RemoteData.loading() },
                },
                Cmd.task({
                    task: () => RulesService.getAllRulesForDraw(drawId),
                    onSuccess: (rules) => {
                        log.debug('FETCH_RULES_SUCCEEDED', { rulesCount: rules?.length });
                        return { type: RewardsRulesMsgType.FETCH_RULES_SUCCEEDED, rules };
                    },
                    onFailure: (err) => {
                        log.error('FETCH_RULES_FAILED', err);
                        return { type: RewardsRulesMsgType.FETCH_RULES_FAILED, error: err };
                    }
                })
            );
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_SUCCEEDED }, ({ rules }) => {
            return singleton({
                ...model,
                rules: { status: RemoteData.success(rules) },
            });
        })
        .with({ type: RewardsRulesMsgType.FETCH_RULES_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                rules: { status: RemoteData.failure(error) },
            });
        })
        .otherwise(() => singleton(model));
};
