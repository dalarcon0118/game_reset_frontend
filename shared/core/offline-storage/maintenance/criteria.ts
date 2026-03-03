import { StorageEnvelope, StorageKey } from '../types';
import { CleanupPredicate } from './types';

/**
 * Colección de criterios de limpieza predefinidos (Lógica Pura)
 */
export const Cleanup = {
  /**
   * Elimina items cuya fecha de creación es anterior a un umbral (en ms)
   * @param thresholdMs Tiempo máximo de vida en milisegundos
   * @param now Tiempo actual (inyectable para tests)
   */
  olderThan: (thresholdMs: number, now: number = Date.now()): CleanupPredicate => {
    return (envelope) => {
      const age = now - envelope.metadata.timestamp;
      return age > thresholdMs;
    };
  },

  /**
   * Elimina items que han superado su fecha de expiración explícita
   * @param now Tiempo actual (inyectable para tests)
   */
  expired: (now: number = Date.now()): CleanupPredicate => {
    return (envelope) => {
      if (!envelope.metadata.expiresAt) return false;
      return envelope.metadata.expiresAt < now;
    };
  },

  /**
   * Elimina items basados en una condición personalizada sobre el contenido o metadatos
   */
  where: <T>(predicate: (envelope: StorageEnvelope<T>, key: StorageKey) => boolean): CleanupPredicate<T> => {
    return predicate;
  },

  /**
   * Combina múltiples criterios: se elimina si CUALQUIERA se cumple (OR)
   */
  any: (...predicates: CleanupPredicate[]): CleanupPredicate => {
    return (envelope, key) => predicates.some(p => p(envelope, key));
  },

  /**
   * Combina múltiples criterios: se elimina si TODOS se cumplen (AND)
   */
  all: (...predicates: CleanupPredicate[]): CleanupPredicate => {
    return (envelope, key) => predicates.every(p => p(envelope, key));
  }
};
