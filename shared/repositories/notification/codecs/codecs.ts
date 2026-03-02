import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '../../../utils/logger';

const log = logger.withTag('NOTIFICATION_CODECS');

export const BackendNotificationCodec = t.intersection([
    t.type({
        id: t.string,
        title: t.string,
        message: t.string,
        type: t.union([
            t.literal('info'),
            t.literal('warning'),
            t.literal('error'),
            t.literal('success')
        ]),
        status: t.union([
            t.literal('pending'),
            t.literal('read')
        ]),
        createdAt: t.string,
    }),
    t.partial({
        readAt: t.union([t.string, t.null]),
        userId: t.union([t.string, t.null]),
        metadata: t.record(t.string, t.unknown),
    })
]);

export const BackendNotificationArrayCodec = t.array(BackendNotificationCodec);

export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    log.warn(`${label} decode failed`, {
        errors: PathReporter.report(result).join('; ')
    });
    return value as T;
};
