import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { ManagementMsgType, ManagementMsg } from './management.types';
import { ListMsgType } from '../bet-list/list.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { BetService } from '@/shared/services/Bet';

export const updateManagement = (model: GlobalModel, msg: ManagementMsg): Return<GlobalModel, ManagementMsg> => {
    return match<ManagementMsg, Return<GlobalModel, ManagementMsg>>(msg)
        .with({ type: ManagementMsgType.INIT }, ({ drawId, fetchExistingBets = true }) => {
            console.log('Management INIT called with drawId:', drawId, 'fetchExistingBets:', fetchExistingBets);

            const commands: any[] = [
                Cmd.http({ url: `/draw/draws/${drawId}/bet-types/` }, (data: any) => ({
                    type: ManagementMsgType.FETCH_BET_TYPES_SUCCEEDED,
                    betTypes: data
                }))
            ];

            if (fetchExistingBets) {
                commands.push({
                    type: 'MSG',
                    payload: {
                        type: 'LIST',
                        payload: {
                            type: ListMsgType.FETCH_BETS_REQUESTED,
                            drawId
                        }
                    }
                });
            } else {
                // Si no se solicitan las apuestas existentes, inicializamos la lista con arrays vacíos
                // para que la interfaz pueda renderizar las columnas correctamente.
                commands.push({
                    type: 'MSG',
                    payload: {
                        type: 'LIST',
                        payload: {
                            type: ListMsgType.FETCH_BETS_SUCCEEDED,
                            fijosCorridos: [],
                            parlets: [],
                            centenas: [],
                            loteria: []
                        }
                    }
                });
            }

            return ret<GlobalModel, ManagementMsg>(
                {
                    ...model,
                    drawId,
                    managementSession: {
                        ...model.managementSession,
                        saveStatus: RemoteData.notAsked(),
                        saveSuccess: false
                    }
                },
                commands
            );
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED }, ({ drawId }) => {
            return ret<GlobalModel, ManagementMsg>(
                { ...model },
                Cmd.http({ url: `/draw/draws/${drawId}/bet-types/` }, (data) => ({
                    type: ManagementMsgType.FETCH_BET_TYPES_SUCCEEDED,
                    betTypes: data
                }))
            );
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_SUCCEEDED }, ({ betTypes }) => {
            console.log('[ManagementUpdate] FETCH_BET_TYPES_SUCCEEDED:', JSON.stringify(betTypes, null, 2));
            const findType = (names: string[]) => {
                const type = betTypes.find(t => {
                    const tName = (t.name || '').toUpperCase();
                    const tCode = (t.code || '').toUpperCase();
                    return names.some(name => {
                        const searchName = name.toUpperCase();
                        return tName.includes(searchName) || tCode === searchName;
                    });
                });
                return type?.id?.toString() || null;
            };

            const types = {
                fijo: findType(['FIJO']),
                corrido: findType(['CORRIDO']),
                parlet: findType(['PARLET']),
                centena: findType(['CENTENA']),
                loteria: findType(['LOTERIA', 'LOTERÍA', 'CUATERNA', 'LS_WEEKLY', 'SEMANAL']),
            };

            console.log('[ManagementUpdate] Identified BetTypes:', JSON.stringify(types, null, 2));

            return singleton<GlobalModel>(({
                ...model,
                managementSession: { ...model.managementSession, betTypes: types },
            }) as GlobalModel);
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_FAILED }, () => {
            return singleton<GlobalModel>({
                ...model,
                managementSession: { ...model.managementSession },
            } as GlobalModel);
        })
        .with({ type: ManagementMsgType.SAVE_BETS_REQUESTED }, ({ drawId }) => {
            const listData = model.listSession.remoteData.type === 'Success'
                ? model.listSession.remoteData.data
                : { fijosCorridos: [], parlets: [], centenas: [], loteria: [] };
            const { fijosCorridos, parlets, centenas, loteria } = listData;

            console.log('[ManagementUpdate] SAVE_BETS_REQUESTED - Payload:', {
                drawId,
                fijosCorridos: fijosCorridos?.length || 0,
                parlets: parlets?.length || 0,
                centenas: centenas?.length || 0,
                loteria: loteria?.length || 0
            });

            return ret<GlobalModel, ManagementMsg>(
                { ...model, managementSession: { ...model.managementSession, saveStatus: RemoteData.loading() } },
                RemoteDataHttp.fetch(
                    () => BetService.create({ drawId, fijosCorridos, parlets, centenas, loteria }),
                    (response) => ({ type: ManagementMsgType.SAVE_BETS_RESPONSE, response })
                )
            );
        })
        .with({ type: ManagementMsgType.SHOW_SAVE_CONFIRMATION }, ({ drawId }) => {
            return ret<GlobalModel, ManagementMsg>(
                model,
                Cmd.alert({
                    title: 'Confirmar Guardado',
                    message: 'Una vez guardadas las apuestas no podrán deshacerse. ¿Deseas continuar?',
                    buttons: [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Guardar',
                            onPressMsg: { type: ManagementMsgType.SAVE_BETS_REQUESTED, drawId }
                        }
                    ]
                })
            );
        })
        .with({ type: ManagementMsgType.SAVE_BETS_RESPONSE }, ({ response }) => {
            console.log('[ManagementUpdate] SAVE_BETS_RESPONSE received:', JSON.stringify(response, null, 2));

            return match(response)
                .with({ type: 'Success' }, ({ data }) => {
                    console.log('[ManagementUpdate] Save successful, navigating to success page');
                    const betId = Array.isArray(data) && data.length > 0 ? data[0].id : (data as any)?.id;
                    const drawId = model.drawId;

                    return ret<GlobalModel, ManagementMsg>(
                        {
                            ...model,
                            managementSession: { ...model.managementSession, saveStatus: response, saveSuccess: true },
                        },
                        Cmd.navigate({
                            pathname: '/lister/bets/success',
                            params: { drawId, betId },
                            method: 'push'
                        })
                    );
                })
                .with({ type: 'Failure' }, ({ error }) => {
                    console.error('[ManagementUpdate] Save failed:', error);
                    const errorMessage = error?.message || error?.detail || 'Ocurrió un error al guardar las apuestas';
                    console.error('[ManagementUpdate] Error message:', errorMessage);

                    return ret<GlobalModel, ManagementMsg>(
                        { ...model, managementSession: { ...model.managementSession, saveStatus: response } },
                        Cmd.alert({
                            title: 'Error al guardar',
                            message: errorMessage
                        })
                    );
                })
                .otherwise(() => {
                    console.warn('[ManagementUpdate] SAVE_BETS_RESPONSE with unexpected response type');
                    return singleton<GlobalModel>(model as GlobalModel);
                });
        })
        .with({ type: ManagementMsgType.RESET_BETS }, () => {
            return singleton<GlobalModel>({
                ...model,
                managementSession: { ...model.managementSession, saveSuccess: false, saveStatus: RemoteData.notAsked() },
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success({ fijosCorridos: [], parlets: [], centenas: [], loteria: [] })
                }
            } as GlobalModel);
        })
        .with({ type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR }, () => {
            return singleton<GlobalModel>({
                ...model,
                managementSession: { ...model.managementSession, saveStatus: RemoteData.notAsked() },
            } as GlobalModel);
        })
        .with({ type: ManagementMsgType.NAVIGATE_REQUESTED }, ({ onConfirm }) => {
            return ret<GlobalModel, ManagementMsg>(
                model,
                Cmd.alert({
                    title: 'Descartar cambios',
                    message: 'Tienes apuestas en la lista sin guardar. ¿Estás seguro que deseas salir? Las apuestas se perderán.',
                    buttons: [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Salir',
                            style: 'destructive',
                            onPressMsg: { type: ManagementMsgType.DISCARD_CHANGES_CONFIRMED, onConfirm }
                        }
                    ]
                })
            );
        })
        .with({ type: ManagementMsgType.DISCARD_CHANGES_CONFIRMED }, ({ onConfirm }) => {
            return ret<GlobalModel, ManagementMsg>(
                model,
                Cmd.task({
                    task: async () => {
                        onConfirm();
                        return { type: ManagementMsgType.NONE };
                    },
                    onSuccess: (msg) => msg,
                    onFailure: () => ({ type: ManagementMsgType.NONE })
                })
            );
        })
        .with({ type: ManagementMsgType.SHARE_FAILED }, ({ error }) => {
            return ret<GlobalModel, ManagementMsg>(
                model,
                Cmd.alert({
                    title: 'Error',
                    message: error
                })
            );
        })
        .with({ type: ManagementMsgType.NONE }, () => singleton(model))
        .exhaustive();
};
