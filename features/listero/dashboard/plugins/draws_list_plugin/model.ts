import { PluginContext } from '@/shared/core/plugins/plugin.types';
import { WebData, RemoteData } from '@/shared/core/remote.data';
import { DRAW_FILTER, Draw } from './core/types';
import { FinancialSummary } from '@/types';
import { PendingBet } from '@/shared/services/offline_storage';

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
// TIPOS OFFLINE (Fase 4)
// ============================================================================

/**
 * Estado financiero offline para un sorteo específico
 */
export interface DrawOfflineState {
  drawId: string;
  localTotalCollected: number;
  localNetResult: number;
  pendingCount: number;
  lastUpdated: number;
}

/**
 * Mapa de estados offline por drawId
 */
export type OfflineStatesMap = Map<string, DrawOfflineState>;

export interface Model {
  context: PluginContext | null;
  config: DrawsListPluginConfig;
  draws: WebData<Draw[]>;
  summary: FinancialSummary | null;
  pendingBets: PendingBet[];
  syncedBets: PendingBet[];
  filteredDraws: Draw[];
  currentFilter: string;
  // Fase 4: Estados offline por sorteo
  offlineStates: OfflineStatesMap;
  // Fase 4: Flag para indicar si hay cambios pendientes de sync
  hasPendingOfflineChanges: boolean;
}

export const initialModel = (params?: { context: PluginContext; config: DrawsListPluginConfig }): Model => {
  const context = params?.context ?? null;
  const config = params?.config ?? defaultConfig;

  return {
    context,
    config,
    draws: RemoteData.notAsked(),
    summary: null,
    pendingBets: [],
    syncedBets: [],
    filteredDraws: [],
    currentFilter: DRAW_FILTER.ALL,
    offlineStates: new Map(),
    hasPendingOfflineChanges: false,
  };
};

// ============================================================================
// SELECTORS OFFLINE (Fase 4)
// ============================================================================

export const offlineSelectors = {
  /**
   * Obtiene el estado offline de un sorteo específico
   */
  getOfflineState: (model: Model, drawId: string): DrawOfflineState | undefined => {
    return model.offlineStates.get(drawId);
  },

  /**
   * Verifica si un sorteo tiene apuestas pendientes offline
   */
  hasPendingOfflineBets: (model: Model, drawId: string): boolean => {
    const state = model.offlineStates.get(drawId);
    return !!state && state.pendingCount > 0;
  },

  /**
   * Obtiene el monto total local recolectado para un sorteo
   */
  getLocalTotalCollected: (model: Model, drawId: string): number => {
    const state = model.offlineStates.get(drawId);
    return state?.localTotalCollected ?? 0;
  },

  /**
   * Calcula el total combinado (servidor + local) para un sorteo
   */
  getCombinedTotalCollected: (model: Model, draw: Draw): number => {
    const serverTotal = draw.totalCollected ?? 0;
    const localTotal = offlineSelectors.getLocalTotalCollected(model, draw.id.toString());
    return serverTotal + localTotal;
  },

  /**
   * Obtiene el total de apuestas pendientes en todos los sorteos
   */
  getTotalPendingCount: (model: Model): number => {
    let total = 0;
    model.offlineStates.forEach(state => {
      total += state.pendingCount;
    });
    return total;
  },
};
