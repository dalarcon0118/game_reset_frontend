/**
 * OfflineSyncPlugin - Store
 * 
 * Store de Zustand + Engine TEA para el plugin de sincronización offline.
 */

import { createElmStore } from '@/shared/core/engine/engine';
import {
  offlineSyncUpdate
} from './update';
import { type OfflineSyncModel, type ToastConfig } from './types';
import { Cmd } from '@/shared/core/tea-utils';
import {
  OfflineSyncMsg,
  SHOW_TOAST,
  HIDE_TOAST,
  DISMISS_ALL_TOASTS,
  OPEN_STATUS_MODAL,
  CLOSE_STATUS_MODAL,
  SET_ACTIVE_TAB,
  FORCE_SYNC,
  CLEAR_ERRORS,
  SYNC_STARTED,
  SYNC_COMPLETED,
  SYNC_ITEM_SUCCESS,
  SYNC_ITEM_ERROR,
  SYNC_ERROR,
} from './msg';
import { initialOfflineSyncModel } from './model';
import {
  setupSyncWorkerSubscriptions,
  startStatsPolling,
  stopStatsPolling,
  startSyncWorker,
  stopSyncWorker,
} from './subscriptions';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('OFFLINE_SYNC_PLUGIN');

// ============================================================================
// Store de Zustand usando createElmStore
// ============================================================================

export const useOfflineSyncStore = createElmStore<OfflineSyncModel, OfflineSyncMsg>({
  initial: initialOfflineSyncModel,
  update: offlineSyncUpdate,
  name: 'OfflineSyncPlugin',
  effectHandlers: {
    // Basic support for TASK commands used in plugins
    'TASK': async (payload, dispatch) => {
      if (payload?.task) {
        try {
          const result = await payload.task();
          if (payload.onSuccess) {
            const nextMsg = payload.onSuccess(result);
            if (nextMsg) dispatch(nextMsg);
          }
        } catch (error) {
          if (payload.onFailure) {
            const nextMsg = payload.onFailure(error);
            if (nextMsg) dispatch(nextMsg);
          }
        }
      }
    }
  }
});

/**
 * Hook para inicialización y limpieza del store.
 * Reemplaza la lógica de inicialización manual que estaba en el store anterior.
 */
export function useOfflineSyncInitialization() {
  const dispatch = useOfflineSyncStore(s => s.dispatch);
  const workerStatus = useOfflineSyncStore(s => s.model.syncStatus.workerStatus);

  const initialize = async () => {
    if (workerStatus === 'running') {
      log.debug('Already initialized, skipping...');
      return;
    }

    log.info('Initializing...');

    try {
      // Start sync worker con periodic sync (cada 5 min)
      await startSyncWorker();

      // Setup subscriptions
      const cleanupSubs = setupSyncWorkerSubscriptions(dispatch);

      // Start stats polling
      startStatsPolling(dispatch);

      log.info('Initialized successfully');
      return cleanupSubs;
    } catch (error) {
      log.error('Initialization error', error);
    }
  };

  const cleanup = () => {
    log.info('Cleaning up...');
    stopStatsPolling();
    stopSyncWorker();
    log.info('Cleanup complete');
  };

  return { initialize, cleanup };
}


// ============================================================================
// Selectors
// ============================================================================

type StoreState = { model: OfflineSyncModel; dispatch: (msg: OfflineSyncMsg) => void };

export const selectToasts = (state: StoreState) => state.model.toasts;
export const selectSyncStatus = (state: StoreState) => state.model.syncStatus;
export const selectPendingCount = (state: StoreState) => state.model.syncStatus.pendingCount;
export const selectIsModalOpen = (state: StoreState) => state.model.syncStatus.isModalOpen;
export const selectPendingBets = (state: StoreState) => state.model.pendingBets;
export const selectErrorBets = (state: StoreState) => state.model.errorBets;
export const selectWorkerStatus = (state: StoreState) => state.model.syncStatus.workerStatus;

// ============================================================================
// Hook para uso en componentes
// ============================================================================

export function useOfflineSync() {
  const model = useOfflineSyncStore(s => s.model);
  const dispatch = useOfflineSyncStore(s => s.dispatch);

  return {
    // Model state
    toasts: model.toasts,
    syncStatus: model.syncStatus,
    pendingCount: model.syncStatus.pendingCount,
    pendingBets: model.pendingBets,
    errorBets: model.errorBets,

    // Actions
    showToast: (toast: ToastConfig) => dispatch(SHOW_TOAST(toast)),
    hideToast: (id: string) => dispatch(HIDE_TOAST({ id })),
    openStatusModal: () => dispatch(OPEN_STATUS_MODAL()),
    closeStatusModal: () => dispatch(CLOSE_STATUS_MODAL()),
    forceSync: () => dispatch(FORCE_SYNC()),
    clearErrors: () => dispatch(CLEAR_ERRORS()),
  };
}

// ============================================================================
// Convenience functions para mostrar toasts desde cualquier lugar
// ============================================================================

let globalDispatch: ((msg: OfflineSyncMsg) => void) | null = null;

// Call this once in your app initialization
export function setGlobalOfflineSyncDispatch(dispatch: (msg: OfflineSyncMsg) => void) {
  globalDispatch = dispatch;
}

// Then you can call these from anywhere
export function showSyncSuccessToast(title: string, message?: string) {
  if (globalDispatch) {
    globalDispatch(SHOW_TOAST({
      id: `success-${Date.now()}`,
      type: 'success',
      title,
      message,
      duration: 3000,
    }));
  }
}

export function showSyncErrorToast(title: string, message?: string) {
  if (globalDispatch) {
    globalDispatch(SHOW_TOAST({
      id: `error-${Date.now()}`,
      type: 'error',
      title,
      message,
      duration: 0,
    }));
  }
}

// showSyncingToast eliminado - el sync es silencioso

// ============================================================================
// Sync Event Helper Functions (Global)
// ============================================================================

export function syncStartedGlobal() {
  if (globalDispatch) {
    globalDispatch(SYNC_STARTED());
  }
}

export function syncCompletedGlobal(succeeded: number, failed: number) {
  if (globalDispatch) {
    globalDispatch(SYNC_COMPLETED({ succeeded, failed }));
  }
}

export function syncItemSuccessGlobal(offlineId: string) {
  if (globalDispatch) {
    globalDispatch(SYNC_ITEM_SUCCESS({ offlineId }));
  }
}

export function syncItemErrorGlobal(offlineId: string, error: string) {
  if (globalDispatch) {
    globalDispatch(SYNC_ITEM_ERROR({ offlineId, error }));
  }
}

export function syncErrorGlobal(error: string) {
  if (globalDispatch) {
    globalDispatch(SYNC_ERROR({ error }));
  }
}

