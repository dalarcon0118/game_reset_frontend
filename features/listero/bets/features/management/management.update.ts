import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { ManagementMsgType, ManagementMsg } from './management.types';
import { ListMsgType, ListData } from '../bet-list/list.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret, singleton } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
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

            return ret(
                {
                    ...model,
                    drawId,
                    managementSession: { ...model.managementSession, isLoading: true, error: null }
                },
                commands
            );
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED }, ({ drawId }) => {
            return ret(
                { ...model, managementSession: { ...model.managementSession, isLoading: true, error: null } },
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

            return singleton({
                ...model,
                managementSession: { ...model.managementSession, isLoading: false, betTypes: types },
            });
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, isLoading: false, error },
            });
        })
        .with({ type: ManagementMsgType.SAVE_BETS_REQUESTED }, ({ drawId }) => {
            const listData = model.listSession.remoteData.type === 'Success'
                ? model.listSession.remoteData.data
                : { fijosCorridos: [], parlets: [], centenas: [], loteria: [] };
            const { fijosCorridos, parlets, centenas, loteria } = listData;

            return ret(
                { ...model, managementSession: { ...model.managementSession, isSaving: true, error: null } },
                Cmd.task({
                    task: BetService.create,
                    args: [{ drawId, fijosCorridos, parlets, centenas, loteria }],
                    onSuccess: (response: any) => ({ type: ManagementMsgType.SAVE_BETS_SUCCEEDED, response }),
                    onFailure: (error: any) => ({
                        type: ManagementMsgType.SAVE_BETS_FAILED,
                        error: error.message || 'Error al guardar apuestas'
                    })
                })
            );
        })
        .with({ type: ManagementMsgType.SAVE_BETS_SUCCEEDED }, () => {
            return ret(
                {
                    ...model,
                    managementSession: { ...model.managementSession, isSaving: false, saveSuccess: true },
                    // Do not reset listSession here to keep bets visible
                },
                Cmd.alert({
                    title: 'Apuestas Guardadas',
                    message: 'Las apuestas han sido guardadas exitosamente.',
                    buttons: [{
                        text: 'OK',
                        onPressMsg: null // Do not reset bets automatically
                    }]
                })
            );
        })
        .with({ type: ManagementMsgType.SAVE_BETS_FAILED }, ({ error }) => {
            return ret(
                { ...model, managementSession: { ...model.managementSession, isSaving: false, error } },
                Cmd.alert({
                    title: 'Error',
                    message: error || 'Hubo un error al guardar las apuestas.'
                })
            );
        })
        .with({ type: ManagementMsgType.RESET_BETS }, () => {
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, saveSuccess: false, error: null },
                listSession: {
                    ...model.listSession,
                    remoteData: RemoteData.success({ fijosCorridos: [], parlets: [], centenas: [], loteria: [] })
                }
            });
        })
        .with({ type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR }, () => {
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, error: null },
            });
        })
        .exhaustive();
};
