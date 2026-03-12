import { match } from 'ts-pattern';
import { RewardsModel } from './model';
import {
    RewardsMsg,
    FETCH_REWARDS_REQUESTED,
    FETCH_REWARDS_SUCCEEDED,
    FETCH_REWARDS_FAILED,
    FETCH_RULES_REQUESTED,
    FETCH_RULES_SUCCEEDED,
    FETCH_RULES_FAILED
} from './types';
import { Cmd, Return, ret, singleton, RemoteData } from '@core/tea-utils';
import { winningRepository } from '@/shared/repositories/winning';
import { rulesRepository } from '@/shared/repositories/rules';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('REWARDS_UPDATE');

export const updateRewards = (model: RewardsModel, msg: RewardsMsg): Return<RewardsModel, RewardsMsg> => {
    return match<RewardsMsg, Return<RewardsModel, RewardsMsg>>(msg)
        .with({ type: FETCH_REWARDS_REQUESTED.toString() }, ({ payload: { drawId } }) => {
            return ret(
                {
                    ...model,
                    rewards: { status: RemoteData.loading() },
                    currentDrawId: drawId,
                },
                Cmd.task({
                    task: () => winningRepository.getWinningNumber(drawId),
                    onSuccess: (rewards) => FETCH_REWARDS_SUCCEEDED(rewards),
                    onFailure: (error) => FETCH_REWARDS_FAILED({ error })
                })
            );
        })
        .with({ type: FETCH_REWARDS_SUCCEEDED.toString() }, ({ payload: rewards }) => {
            return singleton({
                ...model,
                rewards: { status: RemoteData.success(rewards) },
            });
        })
        .with({ type: FETCH_REWARDS_FAILED.toString() }, ({ payload: { error } }) => {
            const status = (error as any)?.status;
            const is404 = status === 404;
            log.debug('Fetch rewards failed', { status, is404 });

            const errorData = is404
                ? { status: 404, isPublished: false, message: 'Números no publicados' }
                : error;

            return singleton({
                ...model,
                rewards: { status: RemoteData.failure(errorData) },
            });
        })
        .with({ type: FETCH_RULES_REQUESTED.toString() }, ({ payload: { drawId } }) => {
            return ret(
                {
                    ...model,
                    rules: { status: RemoteData.loading() },
                    currentDrawId: drawId,
                },
                Cmd.task({
                    task: () => rulesRepository.getAllRulesForDraw(drawId),
                    onSuccess: (rules) => FETCH_RULES_SUCCEEDED(rules),
                    onFailure: (error) => FETCH_RULES_FAILED({ error })
                })
            );
        })
        .with({ type: FETCH_RULES_SUCCEEDED.toString() }, ({ payload: rules }) => {
            return singleton({
                ...model,
                rules: { status: RemoteData.success(rules) },
            });
        })
        .with({ type: FETCH_RULES_FAILED.toString() }, ({ payload: { error } }) => {
            log.error('Fetch rules failed', error);
            return singleton({
                ...model,
                rules: { status: RemoteData.failure(error) },
            });
        })
        .otherwise(() => singleton(model));
};
