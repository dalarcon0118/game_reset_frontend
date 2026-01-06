import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { BetManagementMsgType, BetManagementMsg } from '../types/betManagement.types';
import { Cmd } from '@/shared/core/cmd';
import { BetService } from '@/shared/services/Bet';

export const updateBetManagement = (model: Model, msg: BetManagementMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: BetManagementMsgType.UPDATE_FIJOS_CORRIDOS }, ({ bets }) => {
            return [{ ...model, fijosCorridos: bets }, Cmd.none] as [Model, Cmd];
        })
        .with({ type: BetManagementMsgType.UPDATE_PARLETS }, ({ bets }) => {
            return [{ ...model, parlets: bets }, Cmd.none] as [Model, Cmd];
        })
        .with({ type: BetManagementMsgType.UPDATE_CENTENAS }, ({ bets }) => {
            return [{ ...model, centenas: bets }, Cmd.none] as [Model, Cmd];
        })
        .with({ type: BetManagementMsgType.SAVE_BETS_REQUESTED }, ({ drawId }) => {
            const allBets = {
                fijosCorridos: model.fijosCorridos.map(b => ({ ...b, betTypeId: model.betTypes.fijo })),
                parlets: model.parlets.map(b => ({ ...b, betTypeId: model.betTypes.parlet })),
                centenas: model.centenas.map(b => ({ ...b, betTypeId: model.betTypes.centena })),
                drawId,
            };

            return [
                { ...model, isSaving: true, error: null },
                Cmd.task({
                    task: () => BetService.create(allBets),
                    onSuccess: (response) => ({ type: BetManagementMsgType.SAVE_BETS_SUCCEEDED, response }),
                    onFailure: (err) => ({ type: BetManagementMsgType.SAVE_BETS_FAILED, error: String(err) })
                }),
            ] as [Model, Cmd];
        })
        .with({ type: BetManagementMsgType.SAVE_BETS_SUCCEEDED }, () => {
            return [
                { ...model, isSaving: false, saveSuccess: true, fijosCorridos: [], parlets: [], centenas: [], betBuffer: [] },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: BetManagementMsgType.SAVE_BETS_FAILED }, ({ error }) => {
            return [{ ...model, isSaving: false, error }, Cmd.none] as [Model, Cmd];
        })
        .with({ type: BetManagementMsgType.RESET_BETS }, () => {
            return [
                { ...model, fijosCorridos: [], parlets: [], centenas: [], saveSuccess: false, error: null, betBuffer: [] },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
