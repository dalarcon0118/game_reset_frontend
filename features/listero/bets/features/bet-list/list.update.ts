import { match } from 'ts-pattern';
import { ListMsgType, ListMsg, ListState, ListData } from './list.types';
import { Model } from '../../core/model';
import { Cmd } from '@/shared/core/cmd';
import { BetType } from '@/types';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { BetService } from '@/shared/services/bet';
import { logger } from '@/shared/utils/logger';
import { BetRegistry } from '@/features/listero/bets/core/bet-registry';
import { initializeBetFeatures } from '@/features/listero/bets/core/bootstrap';

// Ensure features are registered
initializeBetFeatures();

const log = logger.withTag('BET_LIST_UPDATE');

export const updateList = (model: Model, msg: ListMsg): Return<Model, ListMsg> => {
    return match(msg)
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }) => {
            log.debug('FETCH_BETS_REQUESTED called', { drawId });

            // Si ya tenemos datos exitosos para ESTE sorteo específico, ignoramos para evitar parpadeos
            if (model.listSession.remoteData.type === 'Success' && model.listSession.loadedDrawId === drawId) {
                log.debug('FETCH_BETS_REQUESTED ignored (already have data for this draw)');
                return singleton(model);
            }

            const nextListSession: ListState = {
                ...model.listSession,
                remoteData: RemoteData.loading<string, ListData>(),
            };
            return ret(
                {
                    ...model,
                    currentDrawId: drawId,
                    listSession: nextListSession,
                },
                Cmd.task(
                    {
                        task: BetService.list,
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            // Use the registry to transform bets, making the list module agnostic
                            const listData = BetRegistry.transformAllBets(bets);

                            log.debug('Transformed data completed', {
                                fijosCorridos: listData.fijosCorridos.length,
                                parlets: listData.parlets.length,
                                centenas: listData.centenas.length,
                                loteria: listData.loteria.length,
                            });

                            return {
                                type: ListMsgType.FETCH_BETS_SUCCEEDED,
                                ...listData
                            };
                        },
                        onFailure: (error: any) => {
                            log.error('FETCH_BETS_FAILED', error);
                            return {
                                type: ListMsgType.FETCH_BETS_FAILED,
                                error: error.message || 'Error al cargar apuestas'
                            };
                        }
                    }
                )
            );
        })
        .with({ type: ListMsgType.REFRESH_BETS_REQUESTED }, ({ drawId }) => {
            log.debug('REFRESH_BETS_REQUESTED', { drawId });
            const nextListSession: ListState = {
                ...model.listSession,
                isRefreshing: true,
            };
            return ret(
                {
                    ...model,
                    listSession: nextListSession,
                },
                Cmd.task(
                    {
                        task: BetService.list,
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            log.debug('FETCH_BETS_SUCCEEDED (refresh)');
                            // Use the registry to transform bets
                            const listData = BetRegistry.transformAllBets(bets);

                            return {
                                type: ListMsgType.FETCH_BETS_SUCCEEDED,
                                ...listData
                            };
                        },
                        onFailure: (error: any) => {
                            log.error('FETCH_BETS_FAILED (refresh)', error);
                            return {
                                type: ListMsgType.FETCH_BETS_FAILED,
                                error: error.message || 'Error al actualizar apuestas'
                            };
                        }
                    }
                )
            );
        })
        .with({ type: ListMsgType.FETCH_BETS_SUCCEEDED }, ({ fijosCorridos, parlets, centenas, loteria }) => {
            log.debug('FETCH_BETS_SUCCEEDED processed successfully');
            const data: ListData = {
                fijosCorridos,
                parlets,
                centenas,
                loteria,
            };
            const result = singleton<Model>({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success<string, ListData>(data),
                    isRefreshing: false,
                    loadedDrawId: model.currentDrawId,
                },
            });
            return result;
        })
        .with({ type: ListMsgType.FETCH_BETS_FAILED }, ({ error }) => {
            return singleton<Model>({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.failure<string, ListData>(error),
                    isRefreshing: false,
                    loadedDrawId: null, // Reset loaded draw ID on failure so we can retry
                },
            });
        })
        .with({ type: ListMsgType.REMOVE_BET }, ({ betId, category }) => {
            const nextRemoteData = RemoteData.map<any, ListData, ListData>((data: ListData) => {
                const updatedCategory = data[category].filter((bet: any) => bet.id !== betId);
                return {
                    ...data,
                    [category]: updatedCategory
                };
            }, model.listSession.remoteData);

            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: nextRemoteData,
                },
            });
        })
        .with({ type: ListMsgType.CLEAR_LIST }, () => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success<any, ListData>(BetRegistry.getEmptyState() as ListData),
                    loadedDrawId: null,
                },
            });
        })
        .with({ type: ListMsgType.UPDATE_LIST_FILTER }, ({ filter }: { filter: string }) => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    aliasFilter: filter,
                },
            });
        })
        .exhaustive();
};
