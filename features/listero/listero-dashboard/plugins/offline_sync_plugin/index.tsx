/**
 * OfflineSyncPlugin - Index
 * 
 * Plugin completo de UI para sincronización offline.
 * 
 * @example
 * ```typescript
 * import { OfflineSyncPlugin } from './plugins/offline_sync_plugin';
 * 
 * // En tu dashboard:
 * <OfflineSyncPlugin.ToastContainer />
 * <OfflineSyncPlugin.Trigger />
 * ```
 */

// Export types
// ============================================================================
// Plugin Interface for Slot System
// ============================================================================

import React from 'react';
import OfflineSyncView, { SyncStatusTrigger } from './view';
import { useOfflineSyncStore } from './store';
import type { OfflineSyncMsg } from './msg';

export * from './types';
export * from './msg';

// Export model & update
export { initialOfflineSyncModel } from './model';
export { offlineSyncUpdate } from './update';

// Export store & hooks
export {
  useOfflineSyncStore,
  useOfflineSync,
  selectToasts,
  selectSyncStatus,
  selectPendingCount,
  selectIsModalOpen,
  selectPendingBets,
  selectErrorBets,
  selectWorkerStatus,
  showSyncSuccessToast,
  showSyncErrorToast,
  // showSyncingToast eliminado - el sync es silencioso
} from './store';

// Export subscriptions
export {
  setupSyncWorkerSubscriptions,
  startStatsPolling,
  stopStatsPolling,
  startSyncWorker,
  cleanupSyncSubscriptions,
  forceSyncNow,
} from './subscriptions';

// Export main view components
export { default as OfflineSyncView } from './view';
export { SyncStatusTrigger } from './view';
export { ToastContainer } from './view';
export { SyncStatusScreen } from './view';

// Componente para Toast Slot (overlay arriba de todo)
export const ToastSlot: React.FC = () => {
  const { model, dispatch } = useOfflineSyncStore();
  return <OfflineSyncView model={ model } dispatch = { dispatch as any } />;
};

// Componente para Trigger Slot (botón flotante)
export const TriggerSlot: React.FC = () => {
  const { pendingCount, openStatusModal } = useOfflineSyncStore();
  return <SyncStatusTrigger pendingCount={ pendingCount } onPress = { openStatusModal } />;
};

// ============================================================================
// Plugin Object (compatible con sistema de plugins)
// ============================================================================

export const OfflineSyncPlugin = {
  // Components
  ToastContainer: ToastSlot,
  Trigger: TriggerSlot,
  View: OfflineSyncView,

  // Hooks
  useStore: useOfflineSyncStore,
  useSync: useOfflineSync,

  // Actions
  showSuccess: showSyncSuccessToast,
  showError: showSyncErrorToast,
  // showSyncing eliminado - el sync es silencioso

  // Lifecycle
  initialize: async () => {
    const store = useOfflineSyncStore.getState();
    await store.init();
  },

  cleanup: () => {
    const store = useOfflineSyncStore.getState();
    store.cleanup();
  },
};

// Default export
export default OfflineSyncPlugin;
