import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { ManagementMsgType, ManagementMsg } from './management.types';
import { Cmd } from '@/shared/core/cmd';
import { DrawService } from '@/shared/services/Draw';
import { BetService } from '@/shared/services/Bet';
import { Return, ret, singleton } from '@/shared/core/return';

export const updateManagement = (model: GlobalModel, msg: ManagementMsg): Return<GlobalModel, ManagementMsg> => {
    return match<ManagementMsg, Return<GlobalModel, ManagementMsg>>(msg)
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED }, ({ drawId }) => {
            return ret(
                model,
                Cmd.task({
                    task: () => DrawService.filterBetsTypeByDrawId(drawId),
                    onSuccess: (betTypes) => ({ type: ManagementMsgType.FETCH_BET_TYPES_SUCCEEDED, betTypes }),
                    onFailure: (err) => ({ type: ManagementMsgType.FETCH_BET_TYPES_FAILED, error: String(err) })
                })
            );
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_SUCCEEDED }, ({ betTypes }) => {
            const types = {
                fijo: betTypes.find(t => t.name === 'Fijo')?.id?.toString() || null,
                corrido: betTypes.find(t => t.name === 'Corrido')?.id?.toString() || null,
                parlet: betTypes.find(t => t.name === 'Parlet')?.id?.toString() || null,
                centena: betTypes.find(t => t.name === 'Centena')?.id?.toString() || null,
            };
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, betTypes: types },
            });
        })
        .with({ type: ManagementMsgType.FETCH_BET_TYPES_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, error },
            });
        })
        .with({ type: ManagementMsgType.SAVE_BETS_REQUESTED }, ({ drawId }) => {
            const allBets = {
                fijosCorridos: model.listSession.fijosCorridos.map(b => ({
                    ...b,
                    betTypeId: b.fijoAmount ? model.managementSession.betTypes.fijo : model.managementSession.betTypes.corrido
                })),
                parlets: model.listSession.parlets.map(b => ({
                    ...b,
                    betTypeId: model.managementSession.betTypes.parlet
                })),
                centenas: model.listSession.centenas.map(b => ({
                    ...b,
                    betTypeId: model.managementSession.betTypes.centena
                })),
                drawId,
            };
            return ret(
                {
                    ...model,
                    managementSession: { ...model.managementSession, isSaving: true, error: null }
                },
                Cmd.task({
                    task: () => BetService.create(allBets),
                    onSuccess: (response) => ({ type: ManagementMsgType.SAVE_BETS_SUCCEEDED, response }),
                    onFailure: (err) => ({ type: ManagementMsgType.SAVE_BETS_FAILED, error: String(err) })
                })
            );
        })
        .with({ type: ManagementMsgType.SAVE_BETS_SUCCEEDED }, () => {
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, isSaving: false, saveSuccess: true },
                listSession: { ...model.listSession, fijosCorridos: [], parlets: [], centenas: [] }
            });
        })
        .with({ type: ManagementMsgType.SAVE_BETS_FAILED }, ({ error }) => {
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, isSaving: false, error },
            });
        })
        .with({ type: ManagementMsgType.RESET_BETS }, () => {
            return singleton({
                ...model,
                managementSession: { ...model.managementSession, saveSuccess: false, error: null },
                listSession: { ...model.listSession, fijosCorridos: [], parlets: [], centenas: [] }
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
