/**
 * OfflineSyncPlugin - Update
 * 
 * Función update del patrón TEA para el plugin de sincronización offline.
 */

import type { OfflineSyncModel } from './types';
import { OfflineSyncMsg } from './msg';
import { MAX_TOASTS, formatTimeSince } from './types';
import { syncWorker } from '@/shared/core/offline-storage/instance';
import { Cmd, Return, ret, singleton } from '@/shared/core/tea-utils';
import { match } from 'ts-pattern';
import type { OfflineSyncBet } from './types';

// ============================================================================
// Helper: Format time since
// ============================================================================

function formatTimeSinceLast(timestamp: number | null): string {
  return formatTimeSince(timestamp);
}

// ============================================================================
// Update Function (TEA)
// ============================================================================

export const offlineSyncUpdate = (
  msg: OfflineSyncMsg,
  model: OfflineSyncModel
): Return<OfflineSyncModel, OfflineSyncMsg> => {
  return match<OfflineSyncMsg, Return<OfflineSyncModel, OfflineSyncMsg>>(msg)
    .with({ type: 'SHOW_TOAST' }, (m) => handleShowToast(model, m.payload))
    .with({ type: 'HIDE_TOAST' }, (m) => handleHideToast(model, m.payload.id))
    .with({ type: 'DISMISS_ALL_TOASTS' }, () => handleDismissAllToasts(model))
    .with({ type: 'SYNC_STARTED' }, () => handleSyncStarted(model))
    .with({ type: 'SYNC_COMPLETED' }, (m) => handleSyncCompleted(model, m.payload))
    .with({ type: 'SYNC_ITEM_SUCCESS' }, (m) => handleSyncItemSuccess(model, m.payload.offlineId))
    .with({ type: 'SYNC_ITEM_ERROR' }, (m) => handleSyncItemError(model, m.payload))
    .with({ type: 'SYNC_ERROR' }, () => handleSyncError(model))
    .with({ type: 'OPEN_STATUS_MODAL' }, () => handleOpenStatusModal(model))
    .with({ type: 'CLOSE_STATUS_MODAL' }, () => handleCloseStatusModal(model))
    .with({ type: 'SET_ACTIVE_TAB' }, (m) => handleSetActiveTab(model, m.payload))
    .with({ type: 'FORCE_SYNC' }, () => handleForceSync(model))
    .with({ type: 'CLEAR_ERRORS' }, () => handleClearErrors(model))
    .with({ type: 'CLEAR_ERROR' }, (m) => handleClearError(model, m.payload.offlineId))
    .with({ type: 'LOADED_PENDING_BETS' }, (m) => handleLoadedPendingBets(model, m.payload))
    .with({ type: 'LOADED_ERROR_BETS' }, (m) => handleLoadedErrorBets(model, m.payload))
    .with({ type: 'LOADED_SYNC_STATS' }, (m) => handleLoadedSyncStats(model, m.payload))
    .with({ type: 'WORKER_STATUS_CHANGED' }, (m) => handleWorkerStatusChanged(model, m.payload))
    .exhaustive();
};

// ============================================================================
// Handlers: Toast Messages
// ============================================================================

function handleShowToast(model: OfflineSyncModel, toast: any): Return<OfflineSyncModel, OfflineSyncMsg> {
  const updatedToasts = [...model.toasts, toast].slice(-MAX_TOASTS);
  return singleton({ ...model, toasts: updatedToasts });
}

function handleHideToast(model: OfflineSyncModel, id: string): Return<OfflineSyncModel, OfflineSyncMsg> {
  const updatedToasts = model.toasts.filter(t => t.id !== id);
  return singleton({ ...model, toasts: updatedToasts });
}

function handleDismissAllToasts(model: OfflineSyncModel): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({ ...model, toasts: [] });
}

// ============================================================================
// Handlers: Sync Events
// ============================================================================

function handleSyncStarted(model: OfflineSyncModel): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      workerStatus: 'running',
    },
  });
}

function handleSyncCompleted(
  model: OfflineSyncModel,
  payload: { succeeded: number; failed: number }
): Return<OfflineSyncModel, OfflineSyncMsg> {
  const now = Date.now();
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      workerStatus: 'idle',
      lastSyncAt: now,
      timeSinceLastSync: formatTimeSinceLast(now),
      pendingCount: Math.max(0, model.syncStatus.pendingCount - payload.succeeded),
      errorCount: model.syncStatus.errorCount + payload.failed,
      syncedToday: model.syncStatus.syncedToday + payload.succeeded,
    },
  });
}

function handleSyncItemSuccess(model: OfflineSyncModel, offlineId: string): Return<OfflineSyncModel, OfflineSyncMsg> {
  const pendingBets = model.pendingBets.filter(b => b.id !== offlineId);
  return singleton({
    ...model,
    pendingBets,
    syncStatus: {
      ...model.syncStatus,
      pendingCount: Math.max(0, model.syncStatus.pendingCount - 1),
      syncedToday: model.syncStatus.syncedToday + 1,
    },
  });
}

function handleSyncItemError(
  model: OfflineSyncModel,
  payload: { offlineId: string; error: string }
): Return<OfflineSyncModel, OfflineSyncMsg> {
  const bet = model.pendingBets.find(b => b.id === payload.offlineId);
  const pendingBets = model.pendingBets.filter(b => b.id !== payload.offlineId);

  if (bet) {
    const errorBet = { ...bet, error: payload.error };
    return singleton({
      ...model,
      pendingBets,
      errorBets: [...model.errorBets, errorBet],
      syncStatus: {
        ...model.syncStatus,
        pendingCount: Math.max(0, model.syncStatus.pendingCount - 1),
        errorCount: model.syncStatus.errorCount + 1,
      },
    });
  }

  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      errorCount: model.syncStatus.errorCount + 1,
    },
  });
}

function handleSyncError(model: OfflineSyncModel): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      workerStatus: 'idle',
    },
  });
}

// ============================================================================
// Handlers: UI Actions
// ============================================================================

function handleOpenStatusModal(model: OfflineSyncModel): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      isModalOpen: true,
    },
  });
}

function handleCloseStatusModal(model: OfflineSyncModel): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      isModalOpen: false,
    },
  });
}

function handleSetActiveTab(
  model: OfflineSyncModel,
  tab: 'stats' | 'pending' | 'errors'
): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      activeTab: tab,
    },
  });
}

function handleForceSync(model: OfflineSyncModel): Return<OfflineSyncModel, OfflineSyncMsg> {
  return ret(
    model,
    Cmd.task({
      task: async () => {
        await syncWorker.triggerSync();
        return null;
      },
      onSuccess: () => null,
      onFailure: () => null,
    })
  );
}

function handleClearErrors(model: OfflineSyncModel): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    errorBets: [],
    syncStatus: {
      ...model.syncStatus,
      errorCount: 0,
    },
  });
}

function handleClearError(model: OfflineSyncModel, offlineId: string): Return<OfflineSyncModel, OfflineSyncMsg> {
  const errorBets = model.errorBets.filter(b => b.id !== offlineId);
  return singleton({
    ...model,
    errorBets,
    syncStatus: {
      ...model.syncStatus,
      errorCount: errorBets.length,
    },
  });
}

// ============================================================================
// Handlers: Data Loaded
// ============================================================================

function handleLoadedPendingBets(model: OfflineSyncModel, bets: OfflineSyncBet[]): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    pendingBets: bets,
    syncStatus: {
      ...model.syncStatus,
      pendingCount: bets.length,
    },
  });
}

function handleLoadedErrorBets(model: OfflineSyncModel, bets: OfflineSyncBet[]): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    errorBets: bets,
    syncStatus: {
      ...model.syncStatus,
      errorCount: bets.length,
    },
  });
}

function handleLoadedSyncStats(
  model: OfflineSyncModel,
  stats: {
    pendingCount: number;
    syncingCount: number;
    errorCount: number;
    syncedToday: number;
    workerStatus: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
    lastSyncAt: number | null;
  }
): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      ...stats,
      timeSinceLastSync: formatTimeSinceLast(stats.lastSyncAt),
    },
  });
}

function handleWorkerStatusChanged(
  model: OfflineSyncModel,
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error'
): Return<OfflineSyncModel, OfflineSyncMsg> {
  return singleton({
    ...model,
    syncStatus: {
      ...model.syncStatus,
      workerStatus: status,
    },
  });
}


// ============================================================================
// Command Helpers
// ============================================================================

/**
 * Commands that can be returned from update
 */
export type OfflineSyncCmd =
  | { type: 'SYNC_NOW' }
  | { type: 'LOAD_PENDING_BETS' }
  | { type: 'LOAD_ERROR_BETS' }
  | { type: 'LOAD_STATS' }
  | { type: 'SHOW_SUCCESS'; title: string; message?: string }
  | { type: 'SHOW_ERROR'; title: string; message?: string }
  | { type: 'DISMISS_TOAST'; id: string };

export function cmdSyncNow(): OfflineSyncCmd {
  return { type: 'SYNC_NOW' };
}

export function cmdLoadPendingBets(): OfflineSyncCmd {
  return { type: 'LOAD_PENDING_BETS' };
}

export function cmdLoadErrorBets(): OfflineSyncCmd {
  return { type: 'LOAD_ERROR_BETS' };
}

export function cmdLoadStats(): OfflineSyncCmd {
  return { type: 'LOAD_STATS' };
}

export function cmdShowSuccess(title: string, message?: string): OfflineSyncCmd {
  return { type: 'SHOW_SUCCESS', title, message };
}

export function cmdShowError(title: string, message?: string): OfflineSyncCmd {
  return { type: 'SHOW_ERROR', title, message };
}

export function cmdDismissToast(id: string): OfflineSyncCmd {
  return { type: 'DISMISS_TOAST', id };
}
