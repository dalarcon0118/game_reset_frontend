/**
 * OfflineSyncPlugin - Tipos
 * 
 * Tipos para el plugin de UI de sincronización offline.
 */

import type { BetDomainModel } from '@/shared/repositories/bet';

// ============================================================================
// Toast Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'syncing';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms (0 = no dismiss)
  action?: {
    label: string;
    onPress: () => void;
  };
}

// ============================================================================
// Sync Status State
// ============================================================================

export interface SyncStatusState {
  // Stats del worker
  pendingCount: number;
  syncingCount: number;
  errorCount: number;
  syncedToday: number;

  // Estado del worker
  workerStatus: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  lastSyncAt: number | null;
  timeSinceLastSync: string;

  // UI state
  isModalOpen: boolean;
  activeTab: 'stats' | 'pending' | 'errors';
}

// ============================================================================
// Plugin Model (TEA)
// ============================================================================

export interface OfflineSyncModel {
  // Toasts activos (queue FIFO)
  toasts: ToastConfig[];

  // Estado de sync
  syncStatus: SyncStatusState;

  // Pending bets para mostrar
  pendingBets: BetDomainModel[];
  errorBets: BetDomainModel[];

  // Loading states
  isLoading: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const TOAST_DURATION_DEFAULT = 4000;
export const TOAST_DURATION_LONG = 6000;
export const TOAST_DURATION_SHORT = 2000;
export const MAX_TOASTS = 3;

// ============================================================================
// Helper Functions
// ============================================================================

export function createToast(
  type: ToastType,
  title: string,
  options?: Partial<Omit<ToastConfig, 'id' | 'type' | 'title'>>
): ToastConfig {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    duration: TOAST_DURATION_DEFAULT,
    ...options,
  };
}

export function getToastIconName(type: ToastType): string {
  switch (type) {
    case 'success': return 'checkmark-circle';
    case 'error': return 'alert-circle';
    case 'warning': return 'warning';
    case 'info': return 'info';
    case 'syncing': return 'sync';
    default: return 'notifications';
  }
}

export function formatTimeSince(timestamp: number | null): string {
  if (!timestamp) return 'Nunca';

  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;

  return new Date(timestamp).toLocaleDateString();
}
