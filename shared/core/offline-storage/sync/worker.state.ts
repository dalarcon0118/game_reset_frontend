import {
    WorkerConfig,
    WorkerStatus,
    WorkerStats,
    SYNC_CONSTANTS,
    SyncReport
} from '../types';

/**
 * Estado interno reactivo del worker de sincronización.
 * Se mantiene separado de la lógica del worker para facilitar su monitoreo.
 */

export interface WorkerInternalState {
    status: WorkerStatus;
    isOnline: boolean;
    consecutiveErrors: number;
    stats: WorkerStats;
    config: WorkerConfig;
    intervalId: any | null;
    currentPromise: Promise<SyncReport> | null;
}

export const defaultWorkerConfig: WorkerConfig = {
    syncInterval: SYNC_CONSTANTS.DEFAULT_INTERVAL,
    maxRetries: SYNC_CONSTANTS.MAX_RETRIES,
    retryBackoffBase: 5000,
    batchSize: SYNC_CONSTANTS.BATCH_SIZE,
};

export const workerState: WorkerInternalState = {
    status: 'idle',
    isOnline: true,
    consecutiveErrors: 0,
    config: defaultWorkerConfig,
    intervalId: null,
    currentPromise: null,
    stats: {
        totalProcessed: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        lastRunAt: null,
    },
};

export const WorkerStateManager = {
    resetStats() {
        workerState.stats = {
            totalProcessed: 0,
            totalSucceeded: 0,
            totalFailed: 0,
            lastRunAt: null,
        };
    },

    incrementErrors() {
        workerState.consecutiveErrors++;
    },

    resetErrors() {
        workerState.consecutiveErrors = 0;
    },

    updateStats(processed: number, succeeded: number, failed: number) {
        workerState.stats.totalProcessed += processed;
        workerState.stats.totalSucceeded += succeeded;
        workerState.stats.totalFailed += failed;
        workerState.stats.lastRunAt = Date.now();
    },

    setStatus(status: WorkerStatus) {
        workerState.status = status;
    },

    setOnline(isOnline: boolean) {
        workerState.isOnline = isOnline;
    }
};
