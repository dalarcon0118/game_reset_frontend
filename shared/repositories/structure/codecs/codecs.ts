import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('STRUCTURE_CODECS');

export const HealthMetricsCodec = t.intersection([
    t.type({
        solvency_ratio: t.number,
        total_pending_prizes: t.number,
    }),
    t.partial({
        trend_percentage: t.number,
        trend: t.number,
        risk_level: t.union([t.literal('LOW'), t.literal('MEDIUM'), t.literal('HIGH'), t.literal('CRITICAL')]),
        risk_score: t.number,
        status: t.union([t.literal('healthy'), t.literal('warning'), t.literal('critical')]),
        net_result: t.number,
    })
]);

export const DashboardSummaryCodec = t.type({
    id_estructura: t.number,
    nombre_estructura: t.string,
    padre_id: t.union([t.number, t.null]),
    totalCollected: t.number,
    totalPaid: t.number,
    totalPending: t.number,
    netTotal: t.number,
    health_metrics: HealthMetricsCodec,
    sorteos: t.array(t.any),
});

export const ChildStructureCodec = t.intersection([
    t.type({
        id: t.number,
        name: t.string,
        type: t.string,
    }),
    t.partial({
        structure_id: t.union([t.number, t.null]),
        total_collected: t.union([t.number, t.null]),
        net_collected: t.union([t.number, t.null]),
        premiums_paid: t.union([t.number, t.null]),
        commissions: t.union([t.number, t.null]),
        draw_name: t.union([t.string, t.null]),
        draw_ids: t.union([t.array(t.number), t.null]),
    })
]);

export const ChildStructureArrayCodec = t.array(ChildStructureCodec);

export const ListeroDrawDetailCodec = t.intersection([
    t.type({
        draw_id: t.number,
        draw_name: t.string,
        status: t.string,
        opening_time: t.string,
        closing_time: t.string,
        total_collected: t.number,
        total_paid: t.number,
        net_result: t.number,
        commissions: t.number,
    }),
    t.partial({
        winning_number: t.union([t.string, t.null]),
        status_closed: t.union([t.literal('success'), t.literal('reported'), t.null]),
    })
]);

export const ListeroDetailsCodec = t.type({
    listero_name: t.string,
    draws: t.array(ListeroDrawDetailCodec),
});

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    log.warn(`${label} decode failed`, {
        errors: PathReporter.report(result).join('; ')
    });
    return value as T;
};
