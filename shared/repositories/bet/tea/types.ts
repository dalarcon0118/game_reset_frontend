import { createMsg } from '@/shared/core/tea-utils/msg';
import { Cmd } from '@/shared/core/tea-utils/cmd';
import { BetDomainModel, BetRepositoryResult, BetPlacementInput, ListBetsFilters, RawBetTotals } from '../bet.types';
import { BetType } from '@/types';

// ============================================================================
// STATE (ESPP: state_type)
// ============================================================================

import { Result } from '@/shared/core';

export interface BetState {
    syncStatus: 'IDLE' | 'SYNCING';
    lastSyncResult: { success: number; failed: number };
}

export const initialModel: BetState = {
    syncStatus: 'IDLE',
    lastSyncResult: { success: 0, failed: 0 },
};

// ============================================================================
// MESSAGES (ESPP: event_type)
// ============================================================================

type Resolve<T> = (val: T) => void;

export const Msg = {
    // Bet operations - Requests (trigger effects)
    placeBetRequested: createMsg<'PLACE_BET_REQUESTED', { data: BetPlacementInput; resolve: Resolve<Result<Error, BetRepositoryResult>> }>('PLACE_BET_REQUESTED'),
    placeBatchRequested: createMsg<'PLACE_BATCH_REQUESTED', { data: BetPlacementInput[]; resolve: Resolve<Result<Error, BetType[]>> }>('PLACE_BATCH_REQUESTED'),
    getBetsRequested: createMsg<'GET_BETS_REQUESTED', { filters?: ListBetsFilters; resolve: Resolve<Result<Error, BetType[]>> }>('GET_BETS_REQUESTED'),

    // Bet operations - Results (passed as Result monad)
    betPlaced: createMsg<'BET_PLACED', { result: Result<Error, BetRepositoryResult>; resolve: Resolve<Result<Error, BetRepositoryResult>> }>('BET_PLACED'),
    batchPlaced: createMsg<'BATCH_PLACED', { result: Result<Error, BetType[]>; resolve: Resolve<Result<Error, BetType[]>> }>('BATCH_PLACED'),
    betsLoaded: createMsg<'BETS_LOADED', { result: Result<Error, BetType[]>; resolve: Resolve<Result<Error, BetType[]>> }>('BETS_LOADED'),

    // Sync - Requests
    syncRequested: createMsg<'SYNC_REQUESTED', { resolve?: Resolve<Result<Error, { success: number; failed: number }>> }>('SYNC_REQUESTED'),
    // Sync - Results
    syncCompleted: createMsg<'SYNC_COMPLETED', { result: Result<Error, { success: number; failed: number }>; resolve?: Resolve<Result<Error, { success: number; failed: number }>> }>('SYNC_COMPLETED'),

    // Maintenance - Requests
    cleanupRequested: createMsg<'CLEANUP_REQUESTED', { today: string; resolve: Resolve<Result<Error, number>> }>('CLEANUP_REQUESTED'),
    cleanupFailedRequested: createMsg<'CLEANUP_FAILED_REQUESTED', { days: number; resolve: Resolve<Result<Error, number>> }>('CLEANUP_FAILED_REQUESTED'),
    recoverStuckRequested: createMsg<'RECOVER_STUCK_REQUESTED', { resolve: Resolve<Result<Error, number>> }>('RECOVER_STUCK_REQUESTED'),
    resetSyncStatusRequested: createMsg<'RESET_SYNC_STATUS_REQUESTED', { offlineId: string; resolve?: Resolve<Result<Error, void>> }>('RESET_SYNC_STATUS_REQUESTED'),
    addPendingBetRequested: createMsg<'ADD_PENDING_BET_REQUESTED', { bet: BetDomainModel; resolve?: Resolve<Result<Error, void>> }>('ADD_PENDING_BET_REQUESTED'),

    // Maintenance - Results
    cleanupCompleted: createMsg<'CLEANUP_COMPLETED', { result: Result<Error, number>; resolve: Resolve<Result<Error, number>> }>('CLEANUP_COMPLETED'),
    cleanupFailed: createMsg<'CLEANUP_FAILED', { result: Result<Error, number>; resolve: Resolve<Result<Error, number>> }>('CLEANUP_FAILED'),
    recoverStuckCompleted: createMsg<'RECOVER_STUCK_COMPLETED', { result: Result<Error, number>; resolve: Resolve<Result<Error, number>> }>('RECOVER_STUCK_COMPLETED'),
    resetSyncStatusCompleted: createMsg<'RESET_SYNC_STATUS_COMPLETED', { result: Result<Error, void>; resolve?: Resolve<Result<Error, void>> }>('RESET_SYNC_STATUS_COMPLETED'),
    pendingBetAdded: createMsg<'PENDING_BET_ADDED', { result: Result<Error, void>; resolve?: Resolve<Result<Error, void>> }>('PENDING_BET_ADDED'),

    // External triggers
    externalStorageChanged: createMsg<'EXTERNAL_STORAGE_CHANGED'>('EXTERNAL_STORAGE_CHANGED'),
    maintenanceCompleted: createMsg<'MAINTENANCE_COMPLETED'>('MAINTENANCE_COMPLETED'),
    onlineStatusChecked: createMsg<'ONLINE_STATUS_CHECKED', { isOnline: boolean }>('ONLINE_STATUS_CHECKED'),

    // Financial - Requests
    financialSummaryRequested: createMsg<'FINANCIAL_SUMMARY_REQUESTED', { todayStart: number; structureId?: string; defaultRate?: number; resolve: Resolve<Result<Error, RawBetTotals>> }>('FINANCIAL_SUMMARY_REQUESTED'),
    totalsByDrawRequested: createMsg<'TOTALS_BY_DRAW_REQUESTED', { todayStart: number; structureId?: string; defaultRate?: number; resolve: Resolve<Result<Error, Record<string, RawBetTotals>>> }>('TOTALS_BY_DRAW_REQUESTED'),

    // Financial - Results
    financialSummaryLoaded: createMsg<'FINANCIAL_SUMMARY_LOADED', { result: Result<Error, RawBetTotals>; resolve: Resolve<Result<Error, RawBetTotals>> }>('FINANCIAL_SUMMARY_LOADED'),
    totalsByDrawLoaded: createMsg<'TOTALS_BY_DRAW_LOADED', { result: Result<Error, Record<string, RawBetTotals>>; resolve: Resolve<Result<Error, Record<string, RawBetTotals>>> }>('TOTALS_BY_DRAW_LOADED'),

    // Global error handler
    effectFailed: createMsg<'EFFECT_FAILED', { effectType: string; error: unknown; resolve?: Resolve<Result<Error, any>> }>('EFFECT_FAILED'),

    noOp: createMsg<'NO_OP'>('NO_OP'),
};

export type BetMsg =
    | ReturnType<typeof Msg.placeBetRequested>
    | ReturnType<typeof Msg.placeBatchRequested>
    | ReturnType<typeof Msg.getBetsRequested>
    | ReturnType<typeof Msg.betPlaced>
    | ReturnType<typeof Msg.batchPlaced>
    | ReturnType<typeof Msg.betsLoaded>
    | ReturnType<typeof Msg.syncRequested>
    | ReturnType<typeof Msg.syncCompleted>
    | ReturnType<typeof Msg.cleanupRequested>
    | ReturnType<typeof Msg.cleanupFailedRequested>
    | ReturnType<typeof Msg.recoverStuckRequested>
    | ReturnType<typeof Msg.resetSyncStatusRequested>
    | ReturnType<typeof Msg.addPendingBetRequested>
    | ReturnType<typeof Msg.cleanupCompleted>
    | ReturnType<typeof Msg.cleanupFailed>
    | ReturnType<typeof Msg.recoverStuckCompleted>
    | ReturnType<typeof Msg.resetSyncStatusCompleted>
    | ReturnType<typeof Msg.pendingBetAdded>
    | ReturnType<typeof Msg.externalStorageChanged>
    | ReturnType<typeof Msg.maintenanceCompleted>
    | ReturnType<typeof Msg.onlineStatusChecked>
    | ReturnType<typeof Msg.financialSummaryRequested>
    | ReturnType<typeof Msg.totalsByDrawRequested>
    | ReturnType<typeof Msg.financialSummaryLoaded>
    | ReturnType<typeof Msg.totalsByDrawLoaded>
    | ReturnType<typeof Msg.effectFailed>
    | ReturnType<typeof Msg.noOp>;

// ============================================================================
// EFFECTS (ESPP: effect_type — declarative instructions)
// ============================================================================

export const Fx = {
    // Bet operations
    placeBet: { type: 'FX_PLACE_BET' },
    placeBatch: { type: 'FX_PLACE_BATCH' },
    getBets: { type: 'FX_GET_BETS' },
    addPendingBet: { type: 'FX_ADD_PENDING_BET' },

    // Sync
    performSync: { type: 'FX_PERFORM_SYNC' },
    notifySyncResult: { type: 'FX_NOTIFY_SYNC_RESULT' },

    // Maintenance
    cleanup: { type: 'FX_CLEANUP' },
    cleanupFailed: { type: 'FX_CLEANUP_FAILED' },
    recoverStuck: { type: 'FX_RECOVER_STUCK' },
    resetSyncStatus: { type: 'FX_RESET_SYNC_STATUS' },
    reconcileOrphans: { type: 'FX_RECONCILE_ORPHANS' },

    // Financial
    financialSummary: { type: 'FX_FINANCIAL_SUMMARY' },
    totalsByDraw: { type: 'FX_TOTALS_BY_DRAW' },

    // Infrastructure - fire-and-forget
    notifySubscribers: { type: 'FX_NOTIFY_SUBSCRIBERS' },
    triggerSyncIfOnline: { type: 'FX_TRIGGER_SYNC_IF_ONLINE' },
} as const;
