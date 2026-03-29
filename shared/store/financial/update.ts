import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import {
    Cmd,
    RemoteDataHttp,
    RemoteData,
    singleton,
    ret
} from '@core/tea-utils';
import { FinancialRepository, financialRepository } from '@/shared/repositories/financial';
import { TimerRepository } from '@/shared/repositories/system/time';
import { calculateFinancials } from '@/shared/utils/financial.logic';

const fetchSummaryCmd = (nodeId: number, commissionRate: number): Cmd => {
    return RemoteDataHttp.fetch(
        async () => {
            const trustedNow = await TimerRepository.getTrustedNow(Date.now());
            const aggregation = await financialRepository.getAggregation(trustedNow, `structure:${nodeId}`);

            const { totals } = calculateFinancials(
                {
                    totalCollected: aggregation.credits,
                    premiumsPaid: aggregation.debits,
                    betCount: aggregation.count
                },
                commissionRate
            );

            return {
                structure_id: nodeId,
                date: new Date(trustedNow).toISOString().split('T')[0],
                total_collected: totals.totalCollected,
                total_paid: totals.premiumsPaid,
                total_net: totals.netResult,
                commissions: totals.estimatedCommission,
                draw_summary: '' // No extra data for this summary level
            };
        },
        (webData) => ({ type: 'SUMMARY_RECEIVED', nodeId, webData })
    );
};

const fetchDrawSummaryCmd = (drawId: number, commissionRate: number): Cmd => {
    return RemoteDataHttp.fetch(
        async () => {
            const trustedNow = TimerRepository.getTrustedNow(Date.now());
            const aggregation = await financialRepository.getAggregation(trustedNow, `structure:0:draw:${drawId}`);

            const { totals } = calculateFinancials(
                {
                    totalCollected: aggregation.credits,
                    premiumsPaid: aggregation.debits,
                    betCount: aggregation.count
                },
                commissionRate
            );

            return {
                totalCollected: totals.totalCollected,
                premiumsPaid: totals.premiumsPaid,
                netResult: totals.netResult,
                draw: { id: drawId } as any,
                date: new Date(trustedNow).toISOString().split('T')[0],
                level: 'DRAW'
            };
        },
        (webData) => ({ type: 'DRAW_SUMMARY_RECEIVED', drawId, webData })
    );
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match<Msg, any>(msg)
        .with({ type: 'FETCH_SUMMARY_REQUESTED' }, ({ nodeId }) => {
            const current = model.summaries[nodeId];

            // Skip if already loading or success
            if (current?.type === 'Loading' || current?.type === 'Success') {
                return singleton(model);
            }

            return ret(
                {
                    ...model,
                    summaries: {
                        ...model.summaries,
                        [nodeId]: RemoteData.loading(),
                    },
                },
                fetchSummaryCmd(nodeId, model.commissionRate)
            );
        })

        .with({ type: 'SUMMARY_RECEIVED' }, ({ nodeId, webData }) => {
            return singleton({
                ...model,
                summaries: {
                    ...model.summaries,
                    [nodeId]: webData,
                },
            });
        })

        .with({ type: 'SYNC_NODES' }, ({ nodeIds }) => {
            // Trigger fetch for any node that doesn't have data yet
            const cmds = nodeIds
                .filter(id => !model.summaries[id] || model.summaries[id].type === 'NotAsked')
                .map(id => fetchSummaryCmd(id, model.commissionRate));

            if (cmds.length === 0) {
                return singleton(model);
            }

            return ret(model, Cmd.batch(cmds));
        })

        .with({ type: 'FETCH_DRAW_SUMMARY_REQUESTED' }, ({ drawId }) => {
            const current = model.drawSummaries[drawId];

            if (current?.type === 'Loading' || current?.type === 'Success') {
                return singleton(model);
            }

            return ret(
                {
                    ...model,
                    drawSummaries: {
                        ...model.drawSummaries,
                        [drawId]: RemoteData.loading(),
                    },
                },
                fetchDrawSummaryCmd(drawId, model.commissionRate)
            );
        })

        .with({ type: 'DRAW_SUMMARY_RECEIVED' }, ({ drawId, webData }) => {
            return singleton({
                ...model,
                drawSummaries: {
                    ...model.drawSummaries,
                    [drawId]: webData,
                },
            });
        })

        .with({ type: 'SYNC_DRAWS' }, ({ drawIds }) => {
            const cmds = drawIds
                .filter(id => !model.drawSummaries[id] || model.drawSummaries[id].type === 'NotAsked')
                .map(id => fetchDrawSummaryCmd(id, model.commissionRate));

            if (cmds.length === 0) {
                return singleton(model);
            }

            return ret(model, Cmd.batch(cmds));
        })

        .with({ type: 'AUTH_USER_SYNCED' }, ({ user }) => {
            const commissionRate = user?.structure?.commission_rate ?? model.commissionRate;

            if (commissionRate === model.commissionRate) {
                return singleton(model);
            }

            return singleton({
                ...model,
                commissionRate
            });
        })

        .exhaustive();

    return [result.model, result.cmd];
};
