import { match, P } from 'ts-pattern';
import { Model, Msg, MsgType } from './types';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { UpdateResult } from '@/shared/core/engine';
import { DrawService } from '@/shared/services/Draw';
import { routes } from '@/config';
import { FinancialSummaryService } from '@/shared/services/FinancialSummary';
import { ApiClientError } from '@/shared/services/ApiClient';
import { pipe, createStream, toArray } from '@/shared/utils/generators';

// --- Subscriptions ---
export const subscriptions = (model: Model) => {
    // Si tenemos datos, refrescar cada 10 segundos para actualizar expiración y contadores
    if (model.draws.data && (model.draws.data as any[]).length > 0) {
        return Sub.every(10000, { type: MsgType.TICK }, 'dashboard-tick');
    }
    return Sub.none();
};

export const initialState: Model = {
    draws: { data: null, filteredData: [], loading: false, error: null },
    summary: { data: null, loading: false, error: null },
    dailyTotals: {
        totalCollected: 0,
        premiumsPaid: 0,
        netResult: 0,
        estimatedCommission: 0,
        amountToRemit: 0,
    },
    userStructureId: null,
    statusFilter: 'open',
    appliedFilter: 'open',
    commissionRate: 0.1, // 10% por defecto según especificación
};

const isClosingSoon = (bettingEndTime?: string) => {
    if (!bettingEndTime) return false;
    const now = new Date();
    const endTime = new Date(bettingEndTime);
    const diff = endTime.getTime() - now.getTime();
    return diff > 0 && diff < 5 * 60 * 1000; // 5 minutes según feature spec
};

const isExpired = (draw: any) => {
    // Si el backend dice que está abierto, no está expirado, sin importar el tiempo
    if (draw.is_betting_open === true) return false;

    if (!draw.betting_end_time) return false;
    const now = new Date();
    const endTime = new Date(draw.betting_end_time);
    return now.getTime() >= endTime.getTime();
};

const applyFiltersAndTotals = (model: Model): Model => {
    const data = (model.draws.data as any[]) || [];
    const filteredData = data.filter((draw) => {
        const expired = isExpired(draw);

        if (model.appliedFilter === 'all') return true;

        if (model.appliedFilter === 'open') {
            return (draw.status === 'open' || draw.is_betting_open === true) && !expired;
        }

        if (model.appliedFilter === 'closed') {
            return (
                draw.status === 'closed' ||
                draw.status === 'completed' ||
                draw.status === 'cancelled' ||
                (draw.status === 'open' && expired)
            );
        }

        if (model.appliedFilter === 'closing_soon') {
            return (draw.status === 'open' || draw.is_betting_open === true) && isClosingSoon(draw.betting_end_time);
        }

        if (model.appliedFilter === 'rewarded') {
            return (draw.premiumsPaid || 0) > 0;
        }
        return true;
    });

    const dailyTotals = filteredData.reduce(
        (acc, draw) => {
            const collected = draw.totalCollected || 0;
            const premiums = draw.premiumsPaid || 0;
            const net = draw.netResult || (collected - premiums);
            const commission = collected * model.commissionRate;

            return {
                totalCollected: acc.totalCollected + collected,
                premiumsPaid: acc.premiumsPaid + premiums,
                netResult: acc.netResult + net,
                estimatedCommission: acc.estimatedCommission + commission,
                amountToRemit: acc.amountToRemit + (net - commission),
            };
        },
        {
            totalCollected: 0,
            premiumsPaid: 0,
            netResult: 0,
            estimatedCommission: 0,
            amountToRemit: 0
        }
    );

    return {
        ...model,
        draws: { ...model.draws, filteredData },
        dailyTotals,
    };
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
            Cmd.navigate({ pathname: routes.lister.bets_rules.screen, params: { id: drawId } }))
        .with({ type: MsgType.REWARDS_CLICKED }, ({ drawId, title }) =>
            Cmd.navigate({ pathname: routes.lister.rewards.screen, params: { id: drawId, title } }))
        .with({ type: MsgType.BETS_LIST_CLICKED }, ({ drawId, title }) =>
            Cmd.navigate({ pathname: routes.lister.bets_list.screen, params: { id: drawId, title } }))
        .with({ type: MsgType.CREATE_BET_CLICKED }, ({ drawId, title }) =>
            Cmd.navigate({ pathname: routes.lister.bets_create.screen, params: { id: drawId, title } }))
        .with({ type: MsgType.NAVIGATE_TO_ERROR }, () =>
            Cmd.navigate({ pathname: '/error' }))
        .otherwise(() => null);

    if (navResult) {
        return [model, navResult];
    }

    // 2. Manejar lógica de estado
    const [nextModel, cmd] = match<Msg, UpdateResult<Model, Msg>>(msg)
        .with({ type: MsgType.SET_USER_STRUCTURE }, ({ id }) =>
            [{ ...model, userStructureId: id }, fetchDrawsCmd(id)])

        .with({ type: MsgType.STATUS_FILTER_CHANGED }, ({ filter }) =>
            [{ ...model, statusFilter: filter, draws: { ...model.draws, loading: true } },
            Cmd.sleep(500, { type: MsgType.APPLY_STATUS_FILTER, filter })])

        .with({ type: MsgType.APPLY_STATUS_FILTER }, ({ filter }) =>
            [{ ...model, appliedFilter: filter, draws: { ...model.draws, loading: false } },
            Cmd.none])

        .with({ type: MsgType.REFRESH_CLICKED }, () =>
            [model, { type: MsgType.FETCH_DATA_REQUESTED } as any])

        .with({ type: MsgType.TICK }, () =>
            [model, Cmd.none])

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

    return [applyFiltersAndTotals(nextModel), cmd];
};
