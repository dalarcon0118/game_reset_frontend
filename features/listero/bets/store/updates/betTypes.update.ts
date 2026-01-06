import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { MsgType } from '../types/index';
import { Cmd } from '@/shared/core/cmd';
import { DrawService } from '@/shared/services/Draw';
import { GameType } from '@/types';

type BetTypesMsg =
    | { type: typeof MsgType.FETCH_BET_TYPES_REQUESTED; drawId: string }
    | { type: typeof MsgType.FETCH_BET_TYPES_SUCCEEDED; betTypes: GameType[] }
    | { type: typeof MsgType.FETCH_BET_TYPES_FAILED; error: string };

export const updateBetTypes = (model: Model, msg: BetTypesMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: MsgType.FETCH_BET_TYPES_REQUESTED }, ({ drawId }) => {
            return [
                { ...model, isLoading: true, drawId },
                Cmd.task({
                    task: () => DrawService.filterBetsTypeByDrawId(drawId),
                    onSuccess: (betTypes) => ({ type: MsgType.FETCH_BET_TYPES_SUCCEEDED, betTypes: betTypes || [] }),
                    onFailure: (err) => ({ type: MsgType.FETCH_BET_TYPES_FAILED, error: String(err) })
                }),
            ] as [Model, Cmd];
        })
        .with({ type: MsgType.FETCH_BET_TYPES_SUCCEEDED }, ({ betTypes }) => {
            const fijo = betTypes.find(bt => bt.code === 'FIJO')?.id || null;
            const corrido = betTypes.find(bt => bt.code === 'CORRIDO')?.id || null;
            const parlet = betTypes.find(bt => bt.code === 'PARLET')?.id || null;
            const centena = betTypes.find(bt => bt.code === 'CENTENA')?.id || null;

            return [
                {
                    ...model,
                    isLoading: false,
                    betTypes: { fijo, corrido, parlet, centena },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: MsgType.FETCH_BET_TYPES_FAILED }, ({ error }) => {
            return [{ ...model, isLoading: false, error }, Cmd.none] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
