import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';
import { createMsg } from '@core/tea-utils';

/**
 * 📊 REWARD MODEL
 * Estado del módulo siguiendo arquitectura TEA con RemoteData.
 */
export interface RewardModel {
  /** Estado de carga de los bet types con premios */
  betTypes: {
    status: import('@core/tea-utils').WebData<BetTypeWithRewardsResponse | null>;
  };
  /** ID de estructura seleccionado (opcional) */
  structureId: string | null;
  /** Cantidad de notificaciones de ganancias pendientes */
  pendingRewardsCount: number;
  /** Error al obtener pendingRewardsCount */
  pendingRewardsError: boolean;
}

/**
 * 📨 REWARD MESSAGES
 * Definición de mensajes usando createMsg para tipos seguros.
 */

/** Inicializa el módulo con datos opcionales */
export const INIT_MODULE = createMsg<'INIT_MODULE', { structureId?: string }>('INIT_MODULE');

/** Solicita carga de bet types con premios */
export const FETCH_BET_TYPES_REQUESTED = createMsg<'FETCH_BET_TYPES_REQUESTED', void>('FETCH_BET_TYPES_REQUESTED');

/** Resultados de carga de bet types (usan WebData para RemoteDataHttp) */
export const FETCH_BET_TYPES_SUCCEEDED = createMsg<'FETCH_BET_TYPES_SUCCEEDED', import('@core/tea-utils').WebData<BetTypeWithRewardsResponse>>('FETCH_BET_TYPES_SUCCEEDED');
export const FETCH_BET_TYPES_FAILED = createMsg<'FETCH_BET_TYPES_FAILED', import('@core/tea-utils').WebData<BetTypeWithRewardsResponse>>('FETCH_BET_TYPES_FAILED');

export type RewardMsg =
  | ReturnType<typeof INIT_MODULE>
  | ReturnType<typeof FETCH_BET_TYPES_REQUESTED>
  | ReturnType<typeof FETCH_BET_TYPES_SUCCEEDED>
  | ReturnType<typeof FETCH_BET_TYPES_FAILED>;

/** Solicita carga de reglas */
export const FETCH_RULES_REQUESTED = createMsg<'FETCH_RULES_REQUESTED', { drawId?: string }>('FETCH_RULES_REQUESTED');

/** Solicita carga de premios */
export const FETCH_REWARDS_REQUESTED = createMsg<'FETCH_REWARDS_REQUESTED', { drawId?: string }>('FETCH_REWARDS_REQUESTED');
