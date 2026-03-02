import { createMsg } from '@/shared/core/msg';
import { PluginContext } from '@/shared/core/plugins/plugin.types';
import { WebData } from '@/shared/core/remote.data';

import { DrawsListPluginConfig } from './model';
import { Draw } from './core/types';
import { FinancialSummary } from '@/types';

export const INIT_CONTEXT = createMsg<'INIT_CONTEXT', { context: PluginContext; config: DrawsListPluginConfig }>('INIT_CONTEXT');
export const SYNC_STATE = createMsg<'SYNC_STATE', {
  draws: WebData<Draw[]>;
  filter: string;
  summary: FinancialSummary | null;
}>('SYNC_STATE');
export const FILTER_DRAWS = createMsg<'FILTER_DRAWS', void>('FILTER_DRAWS');
export const REFRESH_CLICKED = createMsg<'REFRESH_CLICKED', void>('REFRESH_CLICKED');
export const RULES_CLICKED = createMsg<'RULES_CLICKED', string | number>('RULES_CLICKED');
export const REWARDS_CLICKED = createMsg<'REWARDS_CLICKED', { id: string | number; title: string }>('REWARDS_CLICKED');
export const BETS_LIST_CLICKED = createMsg<'BETS_LIST_CLICKED', { id: string | number; title: string }>('BETS_LIST_CLICKED');
export const CREATE_BET_CLICKED = createMsg<'CREATE_BET_CLICKED', { id: string | number; title: string }>('CREATE_BET_CLICKED');
export const NOOP = createMsg<'NOOP', void>('NOOP');

// ============================================================================
// MENSAJES OFFLINE (Fase 4)
// ============================================================================

/**
 * Actualiza el estado financiero offline de un sorteo específico
 * Se dispara cuando cambia el estado offline (apuestas pendientes sincronizadas)
 */
export const OFFLINE_STATE_UPDATED = createMsg<'OFFLINE_STATE_UPDATED', {
  drawId: string;
  localAmount: number;
  localCredits: number;
  localDebits: number;
  localNetResult: number;
  pendingCount: number;
}>('OFFLINE_STATE_UPDATED');

/**
 * Sincroniza todos los estados offline disponibles
 * Se dispara al inicializar o cuando hay cambios globales
 */
export const SYNC_OFFLINE_STATES = createMsg<'SYNC_OFFLINE_STATES', void>('SYNC_OFFLINE_STATES');

/**
 * Actualización masiva de estados offline (batch)
 */
export const BATCH_OFFLINE_UPDATE = createMsg<'BATCH_OFFLINE_UPDATE', {
  updates: {
    drawId: string;
    localAmount: number;
    localCredits: number;
    localDebits: number;
    localNetResult: number;
    pendingCount: number;
  }[];
}>('BATCH_OFFLINE_UPDATE');

export type Msg =
  | typeof INIT_CONTEXT._type
  | typeof SYNC_STATE._type
  | typeof FILTER_DRAWS._type
  | typeof REFRESH_CLICKED._type
  | typeof RULES_CLICKED._type
  | typeof REWARDS_CLICKED._type
  | typeof BETS_LIST_CLICKED._type
  | typeof CREATE_BET_CLICKED._type
  | typeof NOOP._type
  // Offline messages
  | typeof OFFLINE_STATE_UPDATED._type
  | typeof SYNC_OFFLINE_STATES._type
  | typeof BATCH_OFFLINE_UPDATE._type;
