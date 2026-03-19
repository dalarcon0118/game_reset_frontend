import { createMsg } from '@/shared/core/tea-utils';
import { WebData } from '@/shared/core/tea-utils/remote.data';
import { UnifiedRulesResponse } from '@/shared/services/rules';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

export interface WinningRecord {
    id: number;
    winning_number: string;
    date: string;
}

/**
 * 📨 REWARDS MESSAGES
 * Definición de mensajes usando createMsg para tipos seguros.
 */

/** Inicializa el módulo con el ID del sorteo */
export const INIT_MODULE = createMsg<'INIT_MODULE', { drawId: string; title?: string }>('INIT_MODULE');

/** Carga todos los datos necesarios para el sorteo */
export const FETCH_ALL_DATA_REQUESTED = createMsg<'FETCH_ALL_DATA_REQUESTED', { drawId: string }>('FETCH_ALL_DATA_REQUESTED');

/** Resultados de carga de premios generales */
export const FETCH_REWARDS_SUCCEEDED = createMsg<'FETCH_REWARDS_SUCCEEDED', WebData<WinningRecord | null>>('FETCH_REWARDS_SUCCEEDED');
export const FETCH_REWARDS_FAILED = createMsg<'FETCH_REWARDS_FAILED', { error: any }>('FETCH_REWARDS_FAILED');

/** Resultados de carga de reglas */
export const FETCH_RULES_SUCCEEDED = createMsg<'FETCH_RULES_SUCCEEDED', WebData<UnifiedRulesResponse | null>>('FETCH_RULES_SUCCEEDED');
export const FETCH_RULES_FAILED = createMsg<'FETCH_RULES_FAILED', { error: any }>('FETCH_RULES_FAILED');

/** Resultados de carga de apuestas ganadoras del usuario */
export const FETCH_USER_WINNINGS_SUCCEEDED = createMsg<'FETCH_USER_WINNINGS_SUCCEEDED', WebData<WinningBet[]>>('FETCH_USER_WINNINGS_SUCCEEDED');
export const FETCH_USER_WINNINGS_FAILED = createMsg<'FETCH_USER_WINNINGS_FAILED', { error: any }>('FETCH_USER_WINNINGS_FAILED');

/** Acción de navegación atrás */
export const GO_BACK_CLICKED = createMsg<'GO_BACK_CLICKED', void>('GO_BACK_CLICKED');

export type RewardsMsg =
    | ReturnType<typeof INIT_MODULE>
    | ReturnType<typeof FETCH_ALL_DATA_REQUESTED>
    | ReturnType<typeof FETCH_REWARDS_SUCCEEDED>
    | ReturnType<typeof FETCH_REWARDS_FAILED>
    | ReturnType<typeof FETCH_RULES_SUCCEEDED>
    | ReturnType<typeof FETCH_RULES_FAILED>
    | ReturnType<typeof FETCH_USER_WINNINGS_SUCCEEDED>
    | ReturnType<typeof FETCH_USER_WINNINGS_FAILED>
    | ReturnType<typeof GO_BACK_CLICKED>;
