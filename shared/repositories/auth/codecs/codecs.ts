import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '../../../utils/logger';

const log = logger.withTag('AUTH_CODECS');

// Codec flexible para User basado en la interfaz existente
export const BackendUserCodec = t.intersection([
  t.type({
    id: t.union([t.string, t.number]),
    username: t.string,
    name: t.string,
  }),
  t.partial({
    role: t.union([t.string, t.null]),
    email: t.union([t.string, t.null]),
    active: t.boolean,
    password: t.string,
    needs_pin_change: t.boolean,
    structure: t.union([
      t.type({
        id: t.number,
        name: t.string,
        type: t.string,
        path: t.string,
        role_in_structure: t.string,
        commission_rate: t.union([t.number, t.undefined])
      }),
      t.null,
      t.undefined
    ])
  })
]);

export const BackendLoginResponseCodec = t.intersection([
  t.type({
    access: t.string,
    user: BackendUserCodec,
  }),
  t.partial({
    refresh: t.string,
    confirmation_token: t.string,
    daily_secret: t.string,
    needs_pin_change: t.boolean,
    time_anchor: t.type({
      serverTime: t.number,
      signature: t.string,
      validUntil: t.number
    })
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
