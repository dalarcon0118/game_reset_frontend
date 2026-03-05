import {
    SyncQueueItem,
    SyncOutcome,
    SyncStrategy,
    WorkerStatus,
    WorkerConfig,
    DomainEvent,
    SYNC_CONSTANTS,
    SyncReport
} from '../types';
import { logger } from '../../../utils/logger';
import { SyncAdapter } from './adapter';
import { workerState, WorkerStateManager } from './worker.state';
import { isServerReachable } from '../../../utils/network';
import { offlineEventBus } from '../event_bus';

const log = logger.withTag('SYNC_WORKER_CORE');

/**
 * Motor de sincronización agnóstico al dominio.
 * Gestiona la cola, reintentos y orquestación de estrategias.
 */
export class SyncWorkerCore {
    private strategies = new Map<string, SyncStrategy>();

    constructor(private config: WorkerConfig = {
        syncInterval: SYNC_CONSTANTS.DEFAULT_INTERVAL,
        maxRetries: SYNC_CONSTANTS.MAX_RETRIES,
        retryBackoffBase: 5000,
        batchSize: SYNC_CONSTANTS.BATCH_SIZE
    }) { }

    /**
     * Registra una estrategia para un tipo de entidad
     */
    registerStrategy(entityType: string, strategy: SyncStrategy): void {
        this.strategies.set(entityType.toLowerCase(), strategy);
        log.debug(`Strategy registered for: ${entityType}`);
    }

    /**
     * Inicia el worker
     */
    async start(): Promise<void> {
        if (workerState.status === 'running') return;

        log.info('Starting Sync Worker...');
        WorkerStateManager.setStatus('running');

        // Verificación inicial de conectividad
        const online = await isServerReachable();
        WorkerStateManager.setOnline(online);

        this.emitEvent('SYNC_STARTED', 'system');
    }

    /**
     * Detiene el worker
     */
    stop(): void {
        log.info('Stopping Sync Worker...');
        WorkerStateManager.setStatus('stopped');
        this.emitEvent('SYNC_COMPLETED', 'system');
    }

    /**
     * Motor de sincronización bajo demanda.
     * Ejecuta una pasada de sincronización y devuelve un reporte detallado.
     */
    async triggerSync(): Promise<SyncReport> {
        const startTime = Date.now();
        const errors: { entityId: string; type: string; reason: string }[] = [];

        if (workerState.currentPromise) {
            log.debug('Sync already in progress, waiting...');
            return workerState.currentPromise;
        }

        const run = async (): Promise<SyncReport> => {
            const isOnline = await isServerReachable();
            WorkerStateManager.setOnline(isOnline);

            if (!isOnline) {
                return {
                    timestamp: Date.now(),
                    status: 'OFFLINE',
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    errors: [],
                    duration: Date.now() - startTime
                };
            }

            const pendingItems = await SyncAdapter.getPendingItems();
            if (pendingItems.length === 0) {
                return {
                    timestamp: Date.now(),
                    status: 'NO_ITEMS',
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    errors: [],
                    duration: Date.now() - startTime
                };
            }

            log.info(`Manual sync started: ${pendingItems.length} items found.`);
            WorkerStateManager.setStatus('running');
            this.emitEvent('SYNC_STARTED', 'system');

            let succeeded = 0;
            let failed = 0;

            for (const item of pendingItems.slice(0, this.config.batchSize)) {
                const strategy = this.strategies.get(item.type.toLowerCase());

                if (!strategy || !strategy.push) {
                    log.warn(`No push strategy for ${item.type}`);
                    continue;
                }

                try {
                    await SyncAdapter.updateQueueItem(item.id, { status: 'processing' });
                    const outcome = await strategy.push(item);

                    if (outcome.type === 'SUCCESS') {
                        await SyncAdapter.removeFromQueue(item.id);
                        succeeded++;
                        this.emitEvent('SYNC_ITEM_SUCCESS', item.type, { entityId: item.entityId, backendId: outcome.backendId });
                    } else {
                        const reason = outcome.reason || 'Unknown error';
                        await SyncAdapter.updateQueueItem(item.id, {
                            status: outcome.type === 'FATAL_ERROR' ? 'failed' : 'pending',
                            error: reason,
                            attempts: item.attempts + 1,
                            lastAttempt: Date.now()
                        });
                        failed++;
                        errors.push({ entityId: item.entityId, type: item.type, reason });
                        this.emitEvent('SYNC_ITEM_ERROR', item.type, { entityId: item.entityId, error: reason });
                    }
                } catch (error: any) {
                    const msg = error.message || 'Internal error';
                    log.error(`Error processing item ${item.id}`, error);
                    failed++;
                    errors.push({ entityId: item.entityId, type: item.type, reason: msg });
                    await SyncAdapter.updateQueueItem(item.id, {
                        status: 'failed',
                        error: msg,
                        attempts: item.attempts + 1
                    });
                }
            }

            const finalStatus = failed === 0 ? 'SUCCESS' : (succeeded > 0 ? 'PARTIAL' : 'FAILED');
            const report: SyncReport = {
                timestamp: Date.now(),
                status: finalStatus,
                processed: succeeded + failed,
                succeeded,
                failed,
                errors,
                duration: Date.now() - startTime
            };

            WorkerStateManager.updateStats(succeeded + failed, succeeded, failed);
            WorkerStateManager.setStatus('idle');
            this.emitEvent('SYNC_COMPLETED', 'system', report);

            return report;
        };

        workerState.currentPromise = run();
        try {
            return await workerState.currentPromise;
        } finally {
            workerState.currentPromise = null;
        }
    }

    /**
     * Obtiene el estado actual del worker
     */
    getStatus(): WorkerStatus {
        return workerState.status;
    }

    /**
     * Obtiene estadísticas de sincronización
     */
    getStats() {
        return {
            status: workerState.status,
            isOnline: workerState.isOnline,
            totalProcessed: workerState.stats.totalProcessed,
            totalSucceeded: workerState.stats.totalSucceeded,
            totalFailed: workerState.stats.totalFailed,
            lastRunAt: workerState.stats.lastRunAt,
            consecutiveErrors: workerState.consecutiveErrors
        };
    }

    private async processQueue(): Promise<void> {
        const isOnline = await isServerReachable();
        WorkerStateManager.setOnline(isOnline);

        if (!isOnline) {
            log.debug('Sync skipped: Offline');
            return;
        }

        const pendingItems = await SyncAdapter.getPendingItems();
        if (pendingItems.length === 0) return;

        log.debug(`Processing ${Math.min(pendingItems.length, this.config.batchSize)} items...`);

        let succeeded = 0;
        let failed = 0;

        for (const item of pendingItems.slice(0, this.config.batchSize)) {
            const strategy = this.strategies.get(item.type.toLowerCase());

            if (!strategy || !strategy.push) {
                log.warn(`No push strategy for ${item.type}`);
                continue;
            }

            try {
                await SyncAdapter.updateQueueItem(item.id, { status: 'processing' });
                const outcome = await strategy.push(item);

                if (outcome.type === 'SUCCESS') {
                    await SyncAdapter.removeFromQueue(item.id);
                    succeeded++;
                    this.emitEvent('SYNC_COMPLETED', item.type, { entityId: item.entityId, backendId: outcome.backendId });
                } else if (outcome.type === 'FATAL_ERROR') {
                    await SyncAdapter.updateQueueItem(item.id, {
                        status: 'failed',
                        error: outcome.reason,
                        attempts: item.attempts + 1
                    });
                    failed++;
                    this.emitEvent('SYNC_ERROR', item.type, { entityId: item.entityId, error: outcome.reason });
                } else {
                    // RETRY_LATER
                    await SyncAdapter.updateQueueItem(item.id, {
                        status: 'pending',
                        attempts: item.attempts + 1,
                        lastAttempt: Date.now()
                    });
                    failed++;
                }
            } catch (error: any) {
                log.error(`Error processing item ${item.id}`, error);
                failed++;
                await SyncAdapter.updateQueueItem(item.id, {
                    status: 'failed',
                    error: error.message,
                    attempts: item.attempts + 1
                });
            }
        }

        WorkerStateManager.updateStats(succeeded + failed, succeeded, failed);

        if (failed > 0) {
            WorkerStateManager.incrementErrors();
        } else {
            WorkerStateManager.resetErrors();
        }
    }

    /**
     * Emite un evento a través del bus global
     */
    private emitEvent(type: any, entity: string, payload?: any): void {
        offlineEventBus.publish({
            type,
            entity,
            payload,
            timestamp: Date.now()
        });
    }
}

// Instancia única global para el core
export const globalSyncWorker = new SyncWorkerCore();
