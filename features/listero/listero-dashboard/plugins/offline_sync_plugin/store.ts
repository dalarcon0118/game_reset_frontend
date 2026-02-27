/**
 * OfflineSyncPlugin - Store
 * 
 * Store de Zustand + Engine TEA para el plugin de sincronización offline.
 */

import { create } from 'zustand';
import {
  offlineSyncUpdate
} from './update';
import { type OfflineSyncModel } from './types';
import { Cmd, CommandDescriptor } from '@/shared/core/cmd';
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
  SYNC_ERROR
} from './msg';
import { initialOfflineSyncModel } from './model';
import {
  setupSyncWorkerSubscriptions,
  startStatsPolling,
  stopStatsPolling,
  startSyncWorker,
} from './subscriptions';
import { OfflineFinancialService } from '@/shared/services/offline';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('OFFLINE_SYNC_PLUGIN');

// ============================================================================
// Engine: Conecta Zustand con TEA Update
// ============================================================================

function createEngine(dispatch: (msg: OfflineSyncMsg) => void) {
  const executeCmds = (cmd: Cmd) => {
    const flattenCmds = (c: Cmd): CommandDescriptor[] => {
      if (!c) return [];
      if (Array.isArray(c)) {
        return c.flatMap(flattenCmds);
      }
      return [c];
    };

    const cmdsToExecute = flattenCmds(cmd);
    cmdsToExecute.forEach(async (singleCmd: any) => {
      // Basic support for TASK commands used in plugins
      if (singleCmd && singleCmd.type === 'TASK' && singleCmd.payload?.task) {
        try {
          const result = await singleCmd.payload.task();
          if (singleCmd.payload.onSuccess) {
            const nextMsg = singleCmd.payload.onSuccess(result);
            if (nextMsg) dispatch(nextMsg);
          }
        } catch (error) {
          if (singleCmd.payload.onFailure) {
            const nextMsg = singleCmd.payload.onFailure(error);
            if (nextMsg) dispatch(nextMsg);
          }
        }
      }
    });
  };

  return {
    /**
     * Ejecuta el update de TEA y retorna el nuevo modelo
     */
    update: (msg: OfflineSyncMsg, currentModel: OfflineSyncModel): OfflineSyncModel => {
      const result = offlineSyncUpdate(msg, currentModel);
      if (result.cmd) executeCmds(result.cmd);
      return result.model;
    },
  };
}

// ============================================================================
// Store de Zustand
// ============================================================================

interface OfflineSyncStore {
  // Estado del modelo
  model: OfflineSyncModel;

  // Engine reference
  engine: ReturnType<typeof createEngine>;
  dispatch: (msg: OfflineSyncMsg) => void;

  // Actions (dispatches messages)
  showToast: (toast: any) => void;
  hideToast: (id: string) => void;
  dismissAllToasts: () => void;

  openStatusModal: () => void;
  closeStatusModal: () => void;
  setActiveTab: (tab: 'stats' | 'pending' | 'errors') => void;
  forceSync: () => void;
  clearErrors: () => void;

  // Inicialización
  initialize: () => Promise<void>;
  cleanup: () => void;
}

export const useOfflineSyncStore = create<OfflineSyncStore>((set, get) => {
  let engine: ReturnType<typeof createEngine> | null = null;
  let cleanupSubscriptions: (() => void) | null = null;

  const dispatch = (msg: OfflineSyncMsg) => {
    const currentModel = get().model;
    const nextModel = get().engine.update(msg, currentModel);
    set({ model: nextModel });
  };

  engine = createEngine(dispatch);

  return {
    // Initial state
    model: initialOfflineSyncModel,
    engine,
    dispatch,

    // Toast actions
    showToast: (toast) => {
      dispatch(SHOW_TOAST(toast));
    },

    hideToast: (id) => {
      dispatch(HIDE_TOAST({ id }));
    },

    dismissAllToasts: () => {
      dispatch(DISMISS_ALL_TOASTS());
    },

    // Modal actions
    openStatusModal: () => {
      dispatch(OPEN_STATUS_MODAL());
    },

    closeStatusModal: () => {
      dispatch(CLOSE_STATUS_MODAL());
    },

    setActiveTab: (tab) => {
      dispatch(SET_ACTIVE_TAB(tab));
    },

    forceSync: () => {
      dispatch(FORCE_SYNC());
    },

    clearErrors: () => {
      dispatch(CLEAR_ERRORS());
    },

    // Initialization
    initialize: async () => {
      if (get().model.syncStatus.workerStatus === 'running') {
        log.debug('Already initialized, skipping...');
        return;
      }

      log.info('Initializing...');

      try {
        // Initialize offline storage
        await OfflineFinancialService.initialize();

        // Start sync worker con periodic sync (cada 5 min)
        await startSyncWorker();

        // Setup subscriptions
        cleanupSubscriptions = setupSyncWorkerSubscriptions(dispatch);

        // Start stats polling
        startStatsPolling(dispatch);

        log.info('Initialized successfully');
      } catch (error) {
        log.error('Initialization error', error);
      }
    },

    cleanup: () => {
      log.info('Cleaning up...');

      if (cleanupSubscriptions) {
        cleanupSubscriptions();
        cleanupSubscriptions = null;
      }

      stopStatsPolling();
      OfflineFinancialService.stopSyncWorker();

      log.info('Cleanup complete');
    },
  };
});

// ============================================================================
// Selectors
// ============================================================================

export const selectToasts = (state: OfflineSyncStore) => state.model.toasts;
export const selectSyncStatus = (state: OfflineSyncStore) => state.model.syncStatus;
export const selectPendingCount = (state: OfflineSyncStore) => state.model.syncStatus.pendingCount;
export const selectIsModalOpen = (state: OfflineSyncStore) => state.model.syncStatus.isModalOpen;
export const selectPendingBets = (state: OfflineSyncStore) => state.model.pendingBets;
export const selectErrorBets = (state: OfflineSyncStore) => state.model.errorBets;
export const selectWorkerStatus = (state: OfflineSyncStore) => state.model.syncStatus.workerStatus;

// ============================================================================
// Hook para uso en componentes
// ============================================================================

export function useOfflineSync() {
  const store = useOfflineSyncStore();

  return {
    // Model state
    toasts: store.model.toasts,
    syncStatus: store.model.syncStatus,
    pendingCount: store.model.syncStatus.pendingCount,
    pendingBets: store.model.pendingBets,
    errorBets: store.model.errorBets,

    // Actions
    showToast: store.showToast,
    hideToast: store.hideToast,
    openStatusModal: store.openStatusModal,
    closeStatusModal: store.closeStatusModal,
    forceSync: store.forceSync,
    clearErrors: store.clearErrors,

    // Lifecycle
    initialize: store.initialize,
    cleanup: store.cleanup,
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

