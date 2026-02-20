import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUMMARY_PLUGIN_CODECS');

/**
 * Codec para el perfil de usuario que viene del host (/auth/me)
 */
export const UserProfileExternalCodec = t.intersection([
  t.type({
    id: t.union([t.string, t.number]),
    username: t.string,
  }),
  t.partial({
    name: t.string,
    structure: t.union([
      t.type({
        id: t.union([t.string, t.number]),
        commission_rate: t.union([t.number, t.undefined, t.null]),
      }),
      t.undefined,
      t.null,
    ]),
  }),
]);

/**
 * Codec para las preferencias guardadas en storage
 */
export const UserPreferencesExternalCodec = t.partial({
  showBalance: t.boolean,
  theme: t.string,
});

/**
 * Codec para el resumen financiero que viene de la API del host
 */
export const FinancialSummaryExternalCodec = t.partial({
  totalCollected: t.number,
  premiumsPaid: t.number,
});

/**
 * Utilidad para decodificar con fallback y logging de errores.
 * Mantiene la consistencia con otros servicios del proyecto.
 */
export const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string, fallback: T): T => {
  const result = codec.decode(value);
  if (isRight(result)) {
    return result.right;
  }

  const report = PathReporter.report(result).join('; ');
  log.warn(`${label} decode failed`, {
    errors: report,
    usingFallback: true
  });
  return fallback;
};
