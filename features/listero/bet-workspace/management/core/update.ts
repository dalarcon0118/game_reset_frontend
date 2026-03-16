import { match } from 'ts-pattern';
import { ManagementMsgType, ManagementMsg, ManagementState } from './types';
import { Return, ret, singleton, Cmd, RemoteData } from '@core/tea-utils';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { drawRepository } from '@/shared/repositories/draw';
import { GameRegistry } from '@/shared/core/registry/game_registry';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BET_MANAGEMENT_UPDATE');

export interface ManagementContextModel {
    managementSession: ManagementState;
}

export const updateManagement = <M extends ManagementContextModel>(model: M, msg: ManagementMsg): Return<M, ManagementMsg> => {
    return match<ManagementMsg, Return<M, ManagementMsg>>(msg)
        .with({ type: ManagementMsgType.INIT }, ({ drawId, fetchExistingBets, isEditing }) => {
            return ret(
                {
                    ...model,
                    managementSession: {
                        ...model.managementSession,
                        fetchExistingBets: fetchExistingBets ?? true,
                        isEditing: isEditing ?? false,
                    }
                },
                Cmd.batch([
                    Cmd.task({
                        task: async () => {
                            const result = await drawRepository.getDraw(drawId);
                            if (result.isOk()) return result.value;
                            throw result.error;
                        },
                        onSuccess: (draw: any) => ({ type: ManagementMsgType.FETCH_DRAW_DETAILS_RESPONSE, response: RemoteData.success(draw) }),
                        onFailure: (err: any) => ({ type: ManagementMsgType.FETCH_DRAW_DETAILS_RESPONSE, response: RemoteData.failure(err.message) })
                    }),
                    Cmd.task({
                        task: async () => {
                            const result = await drawRepository.getBetTypes(drawId);
                            if (result.isOk()) return result.value;
                            throw result.error;
                        },
                        onSuccess: (gameTypes: any) => ({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE, response: RemoteData.success(gameTypes) }),
                        onFailure: (err: any) => ({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE, response: RemoteData.failure(err.message) })
                    })
                ])
            );
        })
        .with({ type: ManagementMsgType.FETCH_DRAW_DETAILS_RESPONSE }, ({ response }) => {
            return singleton({
                ...model,
                managementSession: {
                    ...model.managementSession,
                    drawDetails: response,
                }
            });
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_RESPONSE }, ({ response }) => {
            let betTypes = { ...model.managementSession.betTypes };
            if (response.type === 'Success') {
                betTypes = GameRegistry.identifyBetTypes(response.data);
            }
            return singleton({
                ...model,
                managementSession: {
                    ...model.managementSession,
                    betTypes,
                }
            });
        })
        .with({ type: ManagementMsgType.SAVE_BETS_RESPONSE }, ({ response }) => {
            return singleton({
                ...model,
                managementSession: {
                    ...model.managementSession,
                    saveStatus: response,
                    saveSuccess: response.type === 'Success',
                }
            });
        })
        .with({ type: ManagementMsgType.RESET_BETS }, () => {
            return singleton({
                ...model,
                managementSession: {
                    ...model.managementSession,
                    saveStatus: RemoteData.notAsked(),
                    saveSuccess: false,
                }
            });
        })
        .with({ type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR }, () => {
            return singleton({
                ...model,
                managementSession: {
                    ...model.managementSession,
                    saveStatus: RemoteData.notAsked(),
                }
            });
        })
        .otherwise(() => singleton(model));
};
