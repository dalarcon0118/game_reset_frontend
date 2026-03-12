import { match } from 'ts-pattern';
import { ListMsgType, ListMsg, ListState } from './types';
import { ListData } from '../../core/types';
import { Cmd, Return, ret, singleton, RemoteData } from '@core/tea-utils';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { logger } from '@/shared/utils/logger';
import { BetRegistry } from '../../core/registry';

const log = logger.withTag('BET_LIST_UPDATE');

export interface ListContextModel {
    listSession: ListState;
    currentDrawId: string | null;
    managementSession?: {
        betTypes: {
            fijo: string | null;
            corrido: string | null;
            parlet: string | null;
            centena: string | null;
            loteria: string | null;
        };
    };
}

export const updateList = <M extends ListContextModel>(model: M, msg: ListMsg): Return<M, ListMsg> => {
    return match(msg)
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }) => {
            log.debug('FETCH_BETS_REQUESTED called', { drawId });

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
                        task: async (args: { drawId?: string }) => {
                            const result = await betRepository.getBets(args);
                            if (result.isOk()) {
                                return result.value;
                            }
                            throw result.error;
                        },
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            // Extraer los betTypes identificados del managementSession
                            const identifiedBetTypes = model.managementSession?.betTypes;
                            const betTypesMap = identifiedBetTypes ? {
                                loteria: identifiedBetTypes.loteria,
                                fijo: identifiedBetTypes.fijo,
                                corrido: identifiedBetTypes.corrido,
                                parlet: identifiedBetTypes.parlet,
                                centena: identifiedBetTypes.centena,
                            } : undefined;

                            const listData = BetRegistry.transformAllBets(bets, betTypesMap);

                            log.debug('Transformed data completed', {
                                fijosCorridos: listData.fijosCorridos.length,
                                parlets: listData.parlets.length,
                                centenas: listData.centenas.length,
                                loteria: listData.loteria.length,
                                identifiedBetTypes: betTypesMap,
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
                        task: async (args: { drawId?: string }) => {
                            const result = await betRepository.getBets(args);
                            if (result.isOk()) {
                                return result.value;
                            }
                            throw result.error;
                        },
                        args: [{ drawId }],
                        onSuccess: (bets: BetType[]) => {
                            log.debug('FETCH_BETS_SUCCEEDED (refresh)');
                            // Extraer los betTypes identificados del managementSession
                            const identifiedBetTypes = model.managementSession?.betTypes;
                            const betTypesMap = identifiedBetTypes ? {
                                loteria: identifiedBetTypes.loteria,
                                fijo: identifiedBetTypes.fijo,
                                corrido: identifiedBetTypes.corrido,
                                parlet: identifiedBetTypes.parlet,
                                centena: identifiedBetTypes.centena,
                            } : undefined;

                            const listData = BetRegistry.transformAllBets(bets, betTypesMap);

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
        .with({ type: ListMsgType.FETCH_BETS_SUCCEEDED }, (data) => {
            const { type, ...listData } = data;
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success(listData as ListData),
                    isRefreshing: false,
                    loadedDrawId: model.currentDrawId,
                },
            });
        })
        .with({ type: ListMsgType.FETCH_BETS_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.failure(error),
                    isRefreshing: false,
                },
            });
        })
        .with({ type: ListMsgType.REMOVE_BET }, ({ betId, category }) => {
            if (model.listSession.remoteData.type !== 'Success') return singleton(model);

            const currentData = model.listSession.remoteData.data;
            const newData = {
                ...currentData,
                [category]: currentData[category as keyof ListData].filter((b: any) => b.id !== betId)
            };

            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success(newData as ListData)
                }
            });
        })
        .with({ type: ListMsgType.CLEAR_LIST }, () => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.notAsked(),
                    loadedDrawId: null,
                }
            });
        })
        .with({ type: ListMsgType.UPDATE_LIST_FILTER }, ({ filter }) => {
            return singleton({
                ...model,
                listSession: {
                    ...model.listSession,
                    aliasFilter: filter
                }
            });
        })
        .otherwise(() => singleton(model));
};
