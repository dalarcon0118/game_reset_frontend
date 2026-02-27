import { match } from 'ts-pattern';
import { ListMsgType, ListMsg } from './list.types';
import { Cmd } from '@/shared/core/cmd';
import { BetType, ParletBet, CentenaBet, FijosCorridosBet } from '@/types';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { BetRepository } from '@/shared/repositories/bet.repository';
import { logger } from '@/shared/utils/logger';
import { BolitaModel, BolitaListState } from './model';
import { transformBolitaBets } from './utils/bet_transformer';

const log = logger.withTag('BOLITA_LIST_UPDATE');

export const updateList = (model: BolitaModel, msg: ListMsg): Return<BolitaModel, ListMsg> => {
    return match(msg)
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }) => {
            log.debug('FETCH_BETS_REQUESTED', { drawId });

            if (model.listState.remoteData.type === 'Success' && model.listState.loadedDrawId === drawId) {
                return singleton(model);
            }

            const nextListState: BolitaListState = {
                ...model.listState,
                remoteData: RemoteData.loading(),
                loadedDrawId: drawId,
            };

            return ret(
                {
                    ...model,
                    currentDrawId: drawId,
                    listState: nextListState,
                },
                Cmd.task(
                    {
                        task: async (args: { drawId?: string }) => {
                            const result = await BetRepository.getBets(args);
                            if (result.isOk()) return result.value;
                            throw result.error;
                        },
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            const data = transformBolitaBets(bets);
                            return {
                                type: ListMsgType.FETCH_BETS_SUCCEEDED,
                                ...data
                            };
                        },
                        onFailure: (error: any) => ({
                            type: ListMsgType.FETCH_BETS_FAILED,
                            error: error.message || 'Error al cargar apuestas'
                        })
                    }
                )
            );
        })
        .with({ type: ListMsgType.FETCH_BETS_SUCCEEDED }, (data) => {
            const { type, ...listData } = data;
            return singleton({
                ...model,
                listState: {
                    ...model.listState,
                    remoteData: RemoteData.success(listData),
                }
            });
        })
        .with({ type: ListMsgType.FETCH_BETS_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                listState: {
                    ...model.listState,
                    remoteData: RemoteData.failure(error),
                }
            });
        })
        .with({ type: ListMsgType.REFRESH_BETS_REQUESTED }, ({ drawId }) => {
            const nextListState: BolitaListState = {
                ...model.listState,
                isRefreshing: true,
            };
            return ret(
                {
                    ...model,
                    listState: nextListState,
                },
                Cmd.task(
                    {
                        task: async (args: { drawId?: string }) => {
                            const result = await BetRepository.getBets(args);
                            if (result.isOk()) return result.value;
                            throw result.error;
                        },
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            const data = transformBolitaBets(bets);
                            return {
                                type: ListMsgType.REFRESH_BETS_SUCCEEDED,
                                ...data
                            };
                        },
                        onFailure: (error: any) => ({
                            type: ListMsgType.REFRESH_BETS_FAILED,
                            error: error.message || 'Error al actualizar'
                        })
                    }
                )
            );
        })
        .with({ type: ListMsgType.REFRESH_BETS_SUCCEEDED }, (data) => {
            const { type, ...listData } = data;
            return singleton({
                ...model,
                listState: {
                    ...model.listState,
                    isRefreshing: false,
                    remoteData: RemoteData.success(listData),
                }
            });
        })
        .with({ type: ListMsgType.REFRESH_BETS_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                listState: {
                    ...model.listState,
                    isRefreshing: false,
                    // We don't set remoteData to failure here to keep showing old data
                }
            });
        })
        .exhaustive();
};
