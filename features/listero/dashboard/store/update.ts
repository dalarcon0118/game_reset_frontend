import { match, P } from 'ts-pattern';
import { Model, Msg, MsgType } from './types';
import { Cmd } from '@/shared/core/cmd';
import { UpdateResult } from '@/shared/core/engine';
import { DrawService } from '@/shared/services/Draw';
import { FinancialSummaryService } from '@/shared/services/FinancialSummary';
import { ApiClientError } from '@/shared/services/ApiClient';
import { pipe, createStream, toArray } from '@/shared/utils/generators';

export const initialState: Model = {
    draws: { data: null, loading: false, error: null },
    summary: { data: null, loading: false, error: null },
    userStructureId: null,
};

// --- Cmd Creators ---

const fetchDrawsCmd = (structureId: string | null): Cmd => {
    if (!structureId) return Cmd.none;
    return Cmd.attempt({
        task: () => DrawService.list(Number(structureId)),
        onSuccess: (draws) => ({ type: MsgType.FETCH_DRAWS_SUCCEEDED, draws }),
        onFailure: (err) => ({ 
            type: MsgType.FETCH_DRAWS_FAILED, 
            error: { 
                message: err.message, 
                status: err instanceof ApiClientError ? err.status : undefined 
            } 
        }),
    });
};

const fetchSummaryCmd = (): Cmd =>
    Cmd.attempt({
        task: () => FinancialSummaryService.get(),
        onSuccess: (summary) => ({ type: MsgType.FETCH_SUMMARY_SUCCEEDED, summary }),
        onFailure: (err) => ({ 
            type: MsgType.FETCH_SUMMARY_FAILED, 
            error: { 
                message: err.message, 
                status: err instanceof ApiClientError ? err.status : undefined 
            } 
        }),
    });

// --- Sub-updaters ---

const updateDraws = (model: Model['draws'], msg: Msg, structureId: string | null): [Model['draws'], Cmd] =>
    match<Msg, [Model['draws'], Cmd]>(msg)
        .with({ type: MsgType.FETCH_DATA_REQUESTED }, () =>
            [{ ...model, loading: true, error: null }, fetchDrawsCmd(structureId)])
        .with({ type: MsgType.FETCH_DRAWS_SUCCEEDED }, ({ draws }) =>
            [{ ...model, loading: false, data: draws }, Cmd.none])
        .with({ type: MsgType.FETCH_DRAWS_FAILED }, ({ error }) =>
            [{ ...model, loading: false, error }, Cmd.none])
        .otherwise(() => [model, Cmd.none]);

const updateSummary = (model: Model['summary'], msg: Msg): [Model['summary'], Cmd] =>
    match<Msg, [Model['summary'], Cmd]>(msg)
        .with({ type: MsgType.FETCH_DATA_REQUESTED }, () =>
            [{ ...model, loading: true, error: null }, fetchSummaryCmd()])
        .with({ type: MsgType.FETCH_SUMMARY_SUCCEEDED }, ({ summary }) =>
            [{ ...model, loading: false, data: summary }, Cmd.none])
        .with({ type: MsgType.FETCH_SUMMARY_FAILED }, ({ error }) =>
            [{ ...model, loading: false, error }, Cmd.none])
        .otherwise(() => [model, Cmd.none]);

// --- Main Update ---

export const update = (model: Model, msg: Msg): UpdateResult<Model, Msg> => {
    // 1. Manejar mensajes de navegación (solo Comandos, no cambian el modelo)
    const navResult = match<Msg, Cmd>(msg)
        .with({ type: MsgType.RULES_CLICKED }, ({ drawId }) =>
            Cmd.navigate({ pathname: '/lister/bets_rules/[id]', params: { id: drawId } }))
        .with({ type: MsgType.REWARDS_CLICKED }, ({ drawId, title }) =>
            Cmd.navigate({ pathname: '/lister/rewards/[id]', params: { id: drawId, title } }))
        .with({ type: MsgType.BETS_LIST_CLICKED }, ({ drawId, title }) =>
            Cmd.navigate({ pathname: '/lister/bets_list/[id]', params: { id: drawId, title } }))
        .with({ type: MsgType.CREATE_BET_CLICKED }, ({ drawId, title }) =>
            Cmd.navigate({ pathname: '/lister/bets_create/[id]', params: { id: drawId, title } }))
        .with({ type: MsgType.NAVIGATE_TO_ERROR }, () =>
            Cmd.navigate({ pathname: '/error' }))
        .otherwise(() => null);

    if (navResult) {
        return [model, navResult];
    }

    // 2. Manejar lógica de estado
    return match<Msg, UpdateResult<Model, Msg>>(msg)
        .with({ type: MsgType.SET_USER_STRUCTURE }, ({ id }) =>
            [{ ...model, userStructureId: id }, fetchDrawsCmd(id)])

        .with({ type: MsgType.REFRESH_CLICKED }, () =>
            [model, { type: MsgType.FETCH_DATA_REQUESTED } as any])

        .with({
            type: P.union(
                MsgType.FETCH_DATA_REQUESTED,
                MsgType.FETCH_DRAWS_SUCCEEDED,
                MsgType.FETCH_DRAWS_FAILED,
                MsgType.FETCH_SUMMARY_SUCCEEDED,
                MsgType.FETCH_SUMMARY_FAILED
            )
        }, (m) => {
            const [nextDraws, drawsCmd] = updateDraws(model.draws, m as Msg, model.userStructureId);
            const [nextSummary, summaryCmd] = updateSummary(model.summary, m as Msg);

            return [
                { ...model, draws: nextDraws, summary: nextSummary },
                [drawsCmd, summaryCmd].filter(Boolean) as Cmd
            ];
        })
        .otherwise(() => [model, Cmd.none]);
};
