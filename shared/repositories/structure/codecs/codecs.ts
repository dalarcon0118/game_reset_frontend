import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('STRUCTURE_CODECS');

export const ChildStructureCodec = t.type({
    id: t.number,
    structure_id: t.number,
    name: t.string,
    type: t.string,
    total_collected: t.number,
    net_collected: t.number,
    premiums_paid: t.number,
    commissions: t.number,
    draw_name: t.string,
    draw_ids: t.array(t.number),
});

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
