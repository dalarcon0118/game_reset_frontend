import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { DrawService } from '@/shared/services/Draw';
import { FinancialSummaryService } from '@/shared/services/FinancialSummary';
import { routes } from '@/config';
import { isClosingSoon, isExpired, DailyTotals } from './core.types';
import { FinancialSummary } from '@/types';
import { singleton, ret, Return } from '@/shared/core/return';

export const subscriptions = (model: Model) => {
    // Refresh every 10 seconds if we have data to update expiration and counters
    return match(model.draws)
        .with({ type: 'Success' }, (rd) =>
            rd.data.length > 0 ? Sub.every(10000, { type: 'TICK' }, 'dashboard-tick') : Sub.none()
        )
        .otherwise(() => Sub.none());
};

const summaryToTotals = (summary: FinancialSummary, commissionRate: number): DailyTotals => {
    const collected = summary.totalCollected || 0;
    const premiums = summary.premiumsPaid || 0;
    const net = summary.netResult || (collected - premiums);
    const commission = collected * commissionRate;

    return {
        totalCollected: collected,
        premiumsPaid: premiums,
        netResult: net,
        estimatedCommission: commission,
        amountToRemit: net - commission,
    };
};

/**
 * Enriches draws with financial information from a summary.
 */
const enrichDraws = (draws: any[], summary: FinancialSummary | null): any[] => {
    if (!summary || !summary.draws) return draws;

    const financialMap = new Map(
        summary.draws.map(d => [d.id_sorteo.toString(), d])
    );

    return draws.map(draw => {
        const financial = financialMap.get(draw.id.toString());
        if (financial) {
            return {
                ...draw,
                totalCollected: financial.colectado,
                premiumsPaid: financial.pagado,
                netResult: financial.neto,
            };
        }
        return draw;
    });
};

const calculateTotals = (draws: any[], commissionRate: number): DailyTotals => {
    return draws.reduce(
        (acc, draw) => {
            const collected = draw.totalCollected || 0;
            const premiums = draw.premiumsPaid || 0;
            const net = draw.netResult || (collected - premiums);
            const commission = collected * commissionRate;

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
};

const fetchDrawsCmd = (structureId: string | null): Cmd => {
    if (!structureId) return Cmd.none;
    console.log('fetchDrawsCmd: Requesting draws for structure', structureId);
    return RemoteDataHttp.fetch(
        () => DrawService.list(Number(structureId)),
        (webData) => {
            console.log('fetchDrawsCmd: Received DRAWS_RECEIVED', webData.type);
            return { type: 'DRAWS_RECEIVED', webData };
        }
    );
};

const fetchSummaryCmd = (structureId: string | null): Cmd => {
    console.log('fetchSummaryCmd: Requesting financial summary for structure', structureId);
    return RemoteDataHttp.fetch(
        () => FinancialSummaryService.get(structureId),
        (webData) => {
            console.log('fetchSummaryCmd: Received SUMMARY_RECEIVED', webData.type);
            return { type: 'SUMMARY_RECEIVED', webData };
        }
    );
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, Return<Model, Msg>>(msg)
        .with({ type: 'FETCH_DATA_REQUESTED' }, ({ structureId }) => {
            const id = structureId || model.userStructureId;

            // Si ya tenemos datos exitosos para este ID, no volvemos a poner Loading
            // a menos que el ID sea diferente al que ya teníamos.
            // Esto evita que efectos de React disparados accidentalmente reseteen el estado.
            if (model.draws.type === 'Success' && model.userStructureId === id) {
                console.log('update: FETCH_DATA_REQUESTED ignored (already have data for)', id);
                return singleton(model);
            }

            // Si ya estamos cargando para este mismo ID, también ignoramos.
            if (model.draws.type === 'Loading' && model.userStructureId === id) {
                console.log('update: FETCH_DATA_REQUESTED ignored (already loading)', id);
                return singleton(model);
            }

            console.log('update: FETCH_DATA_REQUESTED starting load for', id);
            return ret(
                {
                    ...model,
                    userStructureId: id,
                    draws: RemoteData.loading(),
                    summary: RemoteData.loading()
                },
                [fetchDrawsCmd(id), fetchSummaryCmd(id)] as Cmd
            );
        })

        .with({ type: 'DRAWS_RECEIVED' }, ({ webData }) => {
            console.log('update: DRAWS_RECEIVED state', webData.type);

            let enrichedWebData = webData;
            if (webData.type === 'Success') {
                const summary = model.summary.type === 'Success' ? model.summary.data : null;
                enrichedWebData = {
                    ...webData,
                    data: enrichDraws(webData.data, summary)
                };
            }

            const nextModel = { ...model, draws: enrichedWebData };

            // Recalculate totals if success
            if (enrichedWebData.type === 'Success') {
                const filtered = filterDraws(enrichedWebData.data, model.appliedFilter);
                nextModel.filteredDraws = filtered;

                // Prioritize summary data for daily totals if available
                if (model.summary.type === 'Success') {
                    console.log('update: Prioritizing summary data over draws calculation');
                    nextModel.dailyTotals = summaryToTotals(model.summary.data, model.commissionRate);
                } else {
                    nextModel.dailyTotals = calculateTotals(filtered, model.commissionRate);
                }
            } else {
                nextModel.filteredDraws = [];
            }
            return singleton(nextModel);
        })

        .with({ type: 'SUMMARY_RECEIVED' }, ({ webData }) => {
            console.log('update: SUMMARY_RECEIVED state', webData.type);
            const nextModel = { ...model, summary: webData };

            // Si el resumen es exitoso, actualizamos los totales diarios prioritariamente
            if (webData.type === 'Success') {
                console.log('update: Updating dailyTotals from real-time summary', webData.data);
                nextModel.dailyTotals = summaryToTotals(webData.data, model.commissionRate);

                // Also enrich existing draws with new summary info
                if (model.draws.type === 'Success') {
                    const enrichedDrawsList = enrichDraws(model.draws.data, webData.data);
                    nextModel.draws = {
                        ...model.draws,
                        data: enrichedDrawsList
                    };
                    nextModel.filteredDraws = filterDraws(enrichedDrawsList, model.appliedFilter);
                }
            }

            return singleton(nextModel);
        })

        .with({ type: 'REFRESH_CLICKED' }, () =>
            ret(model, [fetchDrawsCmd(model.userStructureId), fetchSummaryCmd(model.userStructureId)] as Cmd)
        )

        .with({ type: 'SET_USER_STRUCTURE' }, ({ id }) =>
            ret({ ...model, userStructureId: id }, [fetchDrawsCmd(id), fetchSummaryCmd(id)] as Cmd)
        )

        .with({ type: 'STATUS_FILTER_CHANGED' }, ({ filter }) =>
            ret(
                { ...model, statusFilter: filter },
                Cmd.sleep(500, { type: 'APPLY_STATUS_FILTER', filter })
            )
        )

        .with({ type: 'APPLY_STATUS_FILTER' }, ({ filter }) => {
            const nextModel = { ...model, appliedFilter: filter };
            if (model.draws.type === 'Success') {
                const filtered = filterDraws(model.draws.data, filter);
                nextModel.filteredDraws = filtered;

                // Prioritize summary data for daily totals if available
                if (model.summary.type === 'Success') {
                    nextModel.dailyTotals = summaryToTotals(model.summary.data, model.commissionRate);
                } else {
                    nextModel.dailyTotals = calculateTotals(filtered, model.commissionRate);
                }
            }
            return singleton(nextModel);
        })

        .with({ type: 'TICK' }, () => {
            // Just trigger a re-render to update timers (isClosingSoon, isExpired)
            // In a more complex scenario, we could re-calculate totals here too
            return singleton(model);
        })

        // Navigation
        .with({ type: 'RULES_CLICKED' }, ({ drawId }) =>
            ret(model, Cmd.navigate({ pathname: routes.lister.bets_rules.screen, params: { id: drawId } }))
        )
        .with({ type: 'REWARDS_CLICKED' }, ({ drawId, title }) =>
            ret(model, Cmd.navigate({ pathname: routes.lister.rewards.screen, params: { id: drawId, title } }))
        )
        .with({ type: 'BETS_LIST_CLICKED' }, ({ drawId, title }) =>
            ret(model, Cmd.navigate({ pathname: routes.lister.bets_list.screen, params: { id: drawId, title } }))
        )
        .with({ type: 'CREATE_BET_CLICKED' }, ({ drawId, title }) =>
            ret(model, Cmd.navigate({ pathname: routes.lister.bets_create.screen, params: { id: drawId, title } }))
        )
        .with({ type: 'NAVIGATE_TO_ERROR' }, () =>
            ret(model, Cmd.navigate({ pathname: '/error' }))
        )
        .exhaustive();

    return [result.model, result.cmd];
};

const filterDraws = (draws: any[], filter: string) => {
    return draws.filter((draw) => {
        const expired = isExpired(draw);

        if (filter === 'all') return true;

        if (filter === 'open') {
            return (draw.status === 'open' || draw.is_betting_open === true) && !expired;
        }

        if (filter === 'closed') {
            return (
                draw.status === 'closed' ||
                draw.status === 'completed' ||
                draw.status === 'cancelled' ||
                (draw.status === 'open' && expired)
            );
        }

        if (filter === 'closing_soon') {
            return (draw.status === 'open' || draw.is_betting_open === true) && isClosingSoon(draw.betting_end_time);
        }

        if (filter === 'rewarded') {
            return draw.status === 'rewarded' || draw.is_rewarded === true;
        }

        return true;
    });
};
