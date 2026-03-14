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

const fetchSummaryCmd = (nodeId: number): Cmd => {
    return RemoteDataHttp.fetch(
        async () => {
            const trustedNow = await TimerRepository.getTrustedNow(Date.now());
            const aggregation = await financialRepository.getAggregation(trustedNow, `structure:${nodeId}`);
            return {
                nodeId,
                totalCollected: aggregation.credits,
                totalPaid: aggregation.debits,
                netResult: aggregation.total,
                date: new Date(trustedNow).toISOString().split('T')[0]
            };
        },
        (webData) => ({ type: 'SUMMARY_RECEIVED', nodeId, webData })
    );
};

const fetchDrawSummaryCmd = (drawId: number): Cmd => {
    return RemoteDataHttp.fetch(
        async () => {
            const trustedNow = TimerRepository.getTrustedNow(Date.now());
            const aggregation = await financialRepository.getAggregation(trustedNow, `structure:0:draw:${drawId}`);

            // Return a zeroed summary if no data
            if (aggregation.count === 0) {
                return {
                    totalCollected: 0,
                    premiumsPaid: 0,
                    netResult: 0,
                    draw: { id: drawId } as any,
                    date: new Date(trustedNow).toISOString().split('T')[0],
                    level: 'DRAW'
                };
            }

            return {
                totalCollected: aggregation.credits,
                premiumsPaid: aggregation.debits,
                netResult: aggregation.total,
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
                fetchSummaryCmd(nodeId)
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
                .map(id => fetchSummaryCmd(id));

            if (cmds.length === 0) {
                return singleton(model);
            }

            const nextSummaries = { ...model.summaries };
            nodeIds.forEach(id => {
                if (!nextSummaries[id] || nextSummaries[id].type === 'NotAsked') {
                    nextSummaries[id] = RemoteData.loading();
                }
            });

            return ret(
                {
                    ...model,
                    summaries: nextSummaries,
                },
                Cmd.batch(cmds)
            );
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
                fetchDrawSummaryCmd(drawId)
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
                .map(id => fetchDrawSummaryCmd(id));

            if (cmds.length === 0) {
                return singleton(model);
            }

            const nextSummaries = { ...model.drawSummaries };
            drawIds.forEach(id => {
                if (!nextSummaries[id] || nextSummaries[id].type === 'NotAsked') {
                    nextSummaries[id] = RemoteData.loading();
                }
            });

            return ret(
                {
                    ...model,
                    drawSummaries: nextSummaries,
                },
                Cmd.batch(cmds)
            );
        })
        .exhaustive();

    return [result.model, result.cmd];
};
