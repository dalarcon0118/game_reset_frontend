import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('WINNING_CODECS');

export const BackendWinningRecordCodec = t.intersection([
    t.type({
        id: t.number,
        draw: t.number,
        winning_number: t.string,
        date: t.string,
        created_at: t.string,
    }),
    t.partial({
        draw_details: t.type({
            id: t.number,
            name: t.string,
        }),
    })
]);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    log.warn(`${label} decode failed`, {
        errors: PathReporter.report(result).join('; ')
    });
    return value as T;
};
