import { PluginContext } from '@core/plugins/plugin.types';
import { WebData, RemoteData, Cmd } from '@core/tea-utils';
import { DRAW_FILTER, Draw } from './core/types';
import { FinancialSummary } from '@/types';
import { BetDomainModel as PendingBet } from '@/shared/repositories/bet/bet.types';
import { Msg } from './msg';

export interface DrawsListPluginConfig {
  drawsStateKey: string;
  filteredDrawsStateKey: string;
  events: {
    refresh: string;
    rules: string;
    rewards: string;
    betsList: string;
    createBet: string;
  };
}

export const defaultConfig: DrawsListPluginConfig = {
  drawsStateKey: 'draws',
  filteredDrawsStateKey: 'filteredDraws',
  events: {
    refresh: 'dashboard:refresh_clicked',
    rules: 'dashboard:rules_clicked',
    rewards: 'dashboard:rewards_clicked',
    betsList: 'dashboard:bets_list_clicked',
    createBet: 'dashboard:create_bet_clicked'
  }
};

// ============================================================================
// TIPOS PARA TOTALES FINANCIEROS POR SORTEO (SSOT: BetRepository)
// ============================================================================

/**
 * Totales financieros calculados on-demand desde BetRepository
 * SSOT: Esta es la única fuente de verdad para datos financieros
 */
export interface DrawFinancialTotals {
  drawId: string;
  totalCollected: number;  // Créditos (ventas)
  premiumsPaid: number;   // Débitos (premios pagados)
  netResult: number;      // Neto (totalCollected - premiumsPaid)
  betCount: number;       // Cantidad de apuestas
  lastUpdated: number;
}

/**
 * Mapa de totales financieros por drawId
 * SSOT: Datos vienen de BetRepository.getTotalsByDrawId()
 */
export type TotalsByDrawIdMap = Map<string, DrawFinancialTotals>;

export interface Model {
  context: PluginContext | null;
  config: DrawsListPluginConfig;
  draws: WebData<Draw[]>;
  summary: FinancialSummary | null;
  pendingBets: PendingBet[];
  syncedBets: PendingBet[];
  filteredDraws: Draw[];
  currentFilter: string;
  // SSOT: Totales financieros por drawId (desde BetRepository)
  totalsByDrawId: TotalsByDrawIdMap;
}

export const initialModel = (params?: { context: PluginContext; config: DrawsListPluginConfig }): [Model, Cmd] => {
  const context = params?.context ?? null;
  const config = params?.config ?? defaultConfig;

  return [
    {
      context,
      config,
      draws: RemoteData.notAsked(),
      summary: null,
      pendingBets: [],
      syncedBets: [],
      filteredDraws: [],
      currentFilter: DRAW_FILTER.ALL,
      totalsByDrawId: new Map(),
    },
    Cmd.none
  ];
};

// ============================================================================
// SELECTORS PARA TOTALES FINANCIEROS (SSOT)
// ============================================================================

/**
 * Obtiene los totales financieros de un sorteo específico
 * SSOT: Viene de BetRepository, no mezclado con Draw
 */
export const financialSelectors = {
  getTotals: (model: Model, drawId: string): DrawFinancialTotals | undefined => {
    return model.totalsByDrawId.get(drawId);
  },

  /**
   * Obtiene el totalCollected para un sorteo
   */
  getTotalCollected: (model: Model, drawId: string): number => {
    const totals = model.totalsByDrawId.get(drawId);
    return totals?.totalCollected ?? 0;
  },

  /**
   * Obtiene el total de apuestas pendientes en todos los sorteos
   */
  getTotalBetCount: (model: Model): number => {
    let total = 0;
    model.totalsByDrawId.forEach(t => {
      total += t.betCount;
    });
    return total;
  },

  /**
   * Obtiene el monto total recolectado (suma de todos los sorteos)
   */
  getGrandTotalCollected: (model: Model): number => {
    let total = 0;
    model.totalsByDrawId.forEach(t => {
      total += t.totalCollected;
    });
    return total;
  },
};
