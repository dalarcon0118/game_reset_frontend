import { SYNC_CONSTANTS } from './types';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

export interface WorkerConfig {
    /** Intervalo base de sincronización en ms (default: 30000 - 30s para ahorrar batería) */
    syncInterval: number;
    /** Máximo número de reintentos (default: 5) */
    maxRetries: number;
    /** Backoff base para reintentos en ms (default: 5000) */
    retryBackoffBase: number;
    /** Batch size para sincronización (default: 10) */
    batchSize: number;
}

export const defaultWorkerConfig: WorkerConfig = {
    syncInterval: 30000, // Aumentado para eficiencia
    maxRetries: SYNC_CONSTANTS.MAX_RETRIES,
    retryBackoffBase: 5000,
    batchSize: 10,
};

// ============================================================================
// ESTADO DEL WORKER
// ============================================================================

export type WorkerState = 'idle' | 'running' | 'paused' | 'stopping' | 'stopped';

export interface WorkerInternalState {
    state: WorkerState;
    intervalId: NodeJS.Timeout | null;
    currentPromise: Promise<void> | null;
    isOnline: boolean;
    netInfoUnsubscribe: (() => void) | null;
    consecutiveErrors: number;
    stats: {
        totalProcessed: number;
        totalSucceeded: number;
        totalFailed: number;
        lastRunAt: number | null;
    };
}

export const workerState: WorkerInternalState = {
    state: 'idle',
    intervalId: null,
    currentPromise: null,
    isOnline: true,
    netInfoUnsubscribe: null,
    consecutiveErrors: 0,
    stats: {
        totalProcessed: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        lastRunAt: null,
    },
};

// ============================================================================
// FUNCIONES DE ESTADO
// ============================================================================

export function resetWorkerStats() {
    workerState.stats = {
        totalProcessed: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        lastRunAt: null,
    };
}

export function incrementConsecutiveErrors() {
    workerState.consecutiveErrors++;
}

export function resetConsecutiveErrors() {
    workerState.consecutiveErrors = 0;
}

export function updateStats(processed: number, succeeded: number, failed: number) {
    workerState.stats.totalProcessed += processed;
    workerState.stats.totalSucceeded += succeeded;
    workerState.stats.totalFailed += failed;
    workerState.stats.lastRunAt = Date.now();
}
