import { createMsg, WebData } from '@core/tea-utils';

import { PluginContext } from '@core/plugins/plugin.types';
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
export const REWARDS_CLICKED = createMsg<'REWARDS_CLICKED', { id: string | number; title: string; draw?: Draw }>('REWARDS_CLICKED');
export const BETS_LIST_CLICKED = createMsg<'BETS_LIST_CLICKED', { id: string | number; title: string; draw?: Draw }>('BETS_LIST_CLICKED');
export const CREATE_BET_CLICKED = createMsg<'CREATE_BET_CLICKED', { id: string | number; title: string; draw?: Draw }>('CREATE_BET_CLICKED');
export const NOOP = createMsg<'NOOP', void>('NOOP');

// ============================================================================
// MENSAJES PARA TOTALES FINANCIEROS (SSOT desde BetRepository)
// ============================================================================

export type DrawTotalsUpdate = {
  drawId: string;
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
  betCount: number;
};

export const BATCH_OFFLINE_UPDATE = createMsg<'BATCH_OFFLINE_UPDATE', {
  updates: DrawTotalsUpdate[];
  timestamp: number;
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
  // SSOT: Financial totals from BetRepository
  | typeof BATCH_OFFLINE_UPDATE._type;
