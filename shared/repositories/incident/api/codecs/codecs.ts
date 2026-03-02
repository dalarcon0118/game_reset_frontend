import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('INCIDENT_CODECS');

export const BackendIncidentCodec = t.intersection([
    t.type({
        id: t.number,
        structure: t.number,
        incident_type: t.string,
        description: t.string,
        reporter: t.number,
        reporter_name: t.string,
        structure_name: t.string,
        status: t.union([
            t.literal('pending'),
            t.literal('in_review'),
            t.literal('resolved'),
            t.literal('cancelled')
        ]),
        created_at: t.string,
        updated_at: t.string,
    }),
    t.partial({
        draw: t.union([t.number, t.null]),
        draw_name: t.union([t.string, t.null]),
    })
]);

export const BackendIncidentArrayCodec = t.array(BackendIncidentCodec);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    log.warn(`${label} decode failed`, {
        errors: PathReporter.report(result).join('; ')
    });
    return value as T;
};
