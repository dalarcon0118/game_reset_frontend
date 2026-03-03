import { StorageEnvelope, StorageKey } from '../types';

/**
 * Predicado que decide si un item debe ser eliminado
 */
export type CleanupPredicate<T = any> = (
  envelope: StorageEnvelope<T>,
  key: StorageKey
) => boolean;

/**
 * Resultado de una operación de limpieza
 */
export interface MaintenanceResult {
  keysProcessed: number;
  keysRemoved: number;
  errors: Array<{ key: StorageKey; error: string }>;
}

/**
 * Opciones para la operación de limpieza
 */
export interface MaintenanceOptions {
  /** Patrón de llaves a considerar (ej: "draw:*") */
  pattern?: string;
  /** Si se debe emitir un evento por cada eliminación */
  silent?: boolean;
}
