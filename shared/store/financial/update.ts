import { match } from 'ts-pattern';
import { Model } from './model';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { FinancialSummaryService } from '@/shared/services/financial_summary';
import { singleton, ret } from '@/shared/core/return';

const fetchSummaryCmd = (nodeId: number): Cmd => {
    return RemoteDataHttp.fetch(
        () => FinancialSummaryService.getNodeFinancialSummary(nodeId),
        (webData) => ({ type: 'SUMMARY_RECEIVED', nodeId, webData })
    );
};

const fetchDrawSummaryCmd = (drawId: number): Cmd => {
    return RemoteDataHttp.fetch(
        async () => {
            const results = await FinancialSummaryService.list({ draw_id: drawId, level: 'DRAW' });
            if (results.length === 0) {
                // Return a zeroed summary instead of throwing an error
                return {
                    totalCollected: 0,
                    premiumsPaid: 0,
                    netResult: 0,
                    draw: { id: drawId } as any,
                    date: new Date().toISOString().split('T')[0],
                    level: 'DRAW'
                };
            }
            return results[0];
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
