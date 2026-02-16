import { createMsg } from '@/shared/core/msg';
import type { ToastConfig } from './types';
import type { PendingBetV2 } from '@/shared/services/offline';

// ============================================================================
// Toast Messages
// ============================================================================

export const SHOW_TOAST = createMsg<'SHOW_TOAST', ToastConfig>('SHOW_TOAST');
export const HIDE_TOAST = createMsg<'HIDE_TOAST', { id: string }>('HIDE_TOAST');
export const DISMISS_ALL_TOASTS = createMsg<'DISMISS_ALL_TOASTS', void>('DISMISS_ALL_TOASTS');

// ============================================================================
// Sync Events Messages (from Worker)
// ============================================================================

export const SYNC_STARTED = createMsg<'SYNC_STARTED', void>('SYNC_STARTED');
export const SYNC_COMPLETED = createMsg<'SYNC_COMPLETED', { succeeded: number; failed: number }>('SYNC_COMPLETED');
export const SYNC_ITEM_SUCCESS = createMsg<'SYNC_ITEM_SUCCESS', { offlineId: string }>('SYNC_ITEM_SUCCESS');
export const SYNC_ITEM_ERROR = createMsg<'SYNC_ITEM_ERROR', { offlineId: string; error: string }>('SYNC_ITEM_ERROR');
export const SYNC_ERROR = createMsg<'SYNC_ERROR', { error: string }>('SYNC_ERROR');

// ============================================================================
// UI Actions Messages
// ============================================================================

export const OPEN_STATUS_MODAL = createMsg<'OPEN_STATUS_MODAL', void>('OPEN_STATUS_MODAL');
export const CLOSE_STATUS_MODAL = createMsg<'CLOSE_STATUS_MODAL', void>('CLOSE_STATUS_MODAL');
export const SET_ACTIVE_TAB = createMsg<'SET_ACTIVE_TAB', 'stats' | 'pending' | 'errors'>('SET_ACTIVE_TAB');
export const FORCE_SYNC = createMsg<'FORCE_SYNC', void>('FORCE_SYNC');
export const CLEAR_ERRORS = createMsg<'CLEAR_ERRORS', void>('CLEAR_ERRORS');
export const CLEAR_ERROR = createMsg<'CLEAR_ERROR', { offlineId: string }>('CLEAR_ERROR');

// ============================================================================
// Data Loaded Messages
// ============================================================================

export const LOADED_PENDING_BETS = createMsg<'LOADED_PENDING_BETS', PendingBetV2[]>('LOADED_PENDING_BETS');
export const LOADED_ERROR_BETS = createMsg<'LOADED_ERROR_BETS', PendingBetV2[]>('LOADED_ERROR_BETS');
export const LOADED_SYNC_STATS = createMsg<'LOADED_SYNC_STATS', {
  pendingCount: number;
  syncingCount: number;
  errorCount: number;
  syncedToday: number;
  workerStatus: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  lastSyncAt: number | null;
}>('LOADED_SYNC_STATS');

// ============================================================================
// Worker Status Messages
// ============================================================================

export const WORKER_STATUS_CHANGED = createMsg<'WORKER_STATUS_CHANGED', 'idle' | 'running' | 'paused' | 'stopped' | 'error'>('WORKER_STATUS_CHANGED');

// ============================================================================
// Union Type
// ============================================================================

export type OfflineSyncMsg =
  | typeof SHOW_TOAST._type
  | typeof HIDE_TOAST._type
  | typeof DISMISS_ALL_TOASTS._type
  | typeof SYNC_STARTED._type
  | typeof SYNC_COMPLETED._type
  | typeof SYNC_ITEM_SUCCESS._type
  | typeof SYNC_ITEM_ERROR._type
  | typeof SYNC_ERROR._type
  | typeof OPEN_STATUS_MODAL._type
  | typeof CLOSE_STATUS_MODAL._type
  | typeof SET_ACTIVE_TAB._type
  | typeof FORCE_SYNC._type
  | typeof CLEAR_ERRORS._type
  | typeof CLEAR_ERROR._type
  | typeof LOADED_PENDING_BETS._type
  | typeof LOADED_ERROR_BETS._type
  | typeof LOADED_SYNC_STATS._type
  | typeof WORKER_STATUS_CHANGED._type;

// ============================================================================
// Helper Functions for Messages (Compatibility)
// ============================================================================

export const showToast = SHOW_TOAST;
export const hideToast = (id: string) => HIDE_TOAST({ id });
export const dismissAllToasts = DISMISS_ALL_TOASTS;

export function showSuccessToast(title: string, message?: string) {
  return SHOW_TOAST({
    id: `success-${Date.now()}`,
    type: 'success',
    title,
    message,
    duration: 3000,
  });
}

export function showErrorToast(title: string, message?: string) {
  return SHOW_TOAST({
    id: `error-${Date.now()}`,
    type: 'error',
    title,
    message,
    duration: 0, // No auto-dismiss
  });
}

export const openStatusModal = OPEN_STATUS_MODAL;
export const closeStatusModal = CLOSE_STATUS_MODAL;
export const setActiveTab = SET_ACTIVE_TAB;
export const forceSync = FORCE_SYNC;
export const clearErrors = CLEAR_ERRORS;
export const clearError = (offlineId: string) => CLEAR_ERROR({ offlineId });

export const loadedPendingBets = LOADED_PENDING_BETS;
export const loadedErrorBets = LOADED_ERROR_BETS;
export const loadedSyncStats = (
  pendingCount: number,
  syncingCount: number,
  errorCount: number,
  syncedToday: number,
  workerStatus: 'idle' | 'running' | 'paused' | 'stopped' | 'error',
  lastSyncAt: number | null
) => LOADED_SYNC_STATS({ pendingCount, syncingCount, errorCount, syncedToday, workerStatus, lastSyncAt });

export const syncStarted = SYNC_STARTED;
export const syncCompleted = (payload: { succeeded: number; failed: number }) => SYNC_COMPLETED(payload);
export const syncItemSuccess = (payload: { offlineId: string }) => SYNC_ITEM_SUCCESS(payload);
export const syncItemError = (payload: { offlineId: string; error: string }) => SYNC_ITEM_ERROR(payload);
export const syncError = (payload: { error: string }) => SYNC_ERROR(payload);
export const workerStatusChanged = WORKER_STATUS_CHANGED;

