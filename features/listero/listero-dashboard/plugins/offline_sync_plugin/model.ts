/**
 * OfflineSyncPlugin - Model
 * 
 * Estado inicial para el plugin de UI de sincronización offline.
 */

import type { OfflineSyncModel } from './types';
import type { BetDomainModel } from '@/shared/repositories/bet';

export const initialOfflineSyncModel: OfflineSyncModel = {
  // Toasts activos
  toasts: [],
  
  // Estado de sync
  syncStatus: {
    // Stats del worker
    pendingCount: 0,
    syncingCount: 0,
    errorCount: 0,
    syncedToday: 0,
    
    // Estado del worker
    workerStatus: 'idle',
    lastSyncAt: null,
    timeSinceLastSync: 'Nunca',
    
    // UI state
    isModalOpen: false,
    activeTab: 'stats',
  },
  
  // Pending bets
  pendingBets: [],
  errorBets: [],
  
  // Loading
  isLoading: false,
};
