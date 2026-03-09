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

            const { succeeded, failed, errors: batchErrors } = await this.executeSyncCycle(
                pendingItems.slice(0, this.config.batchSize)
            );

            errors.push(...batchErrors);

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

    /**
     * Lógica central de ejecución de un ciclo de sincronización para un conjunto de ítems.
     * Soporta procesamiento por lotes si la estrategia lo permite.
     */
    private async executeSyncCycle(items: SyncQueueItem[]): Promise<{
        succeeded: number;
        failed: number;
        errors: { entityId: string; type: string; reason: string }[];
    }> {
        let succeeded = 0;
        let failed = 0;
        const errors: { entityId: string; type: string; reason: string }[] = [];

        // Agrupar ítems por tipo para aprovechar pushBatch
        const groups = items.reduce((acc, item) => {
            const type = item.type.toLowerCase();
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {} as Record<string, SyncQueueItem[]>);

        for (const [type, group] of Object.entries(groups)) {
            const strategy = this.strategies.get(type);

            if (!strategy) {
                log.warn(`No strategy for ${type}`);
                for (const item of group) {
                    failed++;
                    const reason = `No strategy for ${type}`;
                    errors.push({ entityId: item.entityId, type: item.type, reason });
                    await SyncAdapter.updateQueueItem(item.id, { status: 'failed', error: reason });
                }
                continue;
            }

            try {
                // Marcar todos como en procesamiento por lote
                await SyncAdapter.updateBatchQueueItems(group.map(item => ({
                    id: item.id,
                    data: { status: 'processing' }
                })));

                let outcomes: SyncOutcome[];

                if (strategy.pushBatch && group.length > 1) {
                    log.debug(`Using pushBatch for ${type} with ${group.length} items`);
                    outcomes = await strategy.pushBatch(group);
                } else if (strategy.push) {
                    log.debug(`Using sequential push for ${type}`);
                    outcomes = await Promise.all(group.map(item => strategy.push!(item)));
                } else {
                    throw new Error(`Strategy for ${type} does not support push or pushBatch`);
                }

                // Preparar actualizaciones y eliminaciones por lote
                const itemsToRemove: string[] = [];
                const itemsToUpdate: { id: string, data: Partial<SyncQueueItem> }[] = [];

                for (let i = 0; i < group.length; i++) {
                    const item = group[i];
                    const outcome = outcomes[i];

                    if (outcome.type === 'SUCCESS') {
                        itemsToRemove.push(item.id);
                        succeeded++;
                        this.emitEvent('SYNC_ITEM_SUCCESS', item.type, {
                            entityId: item.entityId,
                            backendId: outcome.backendId
                        });
                    } else {
                        const reason = outcome.reason || 'Unknown error';
                        const isFatal = outcome.type === 'FATAL_ERROR';

                        itemsToUpdate.push({
                            id: item.id,
                            data: {
                                status: isFatal ? 'failed' : 'pending',
                                error: reason,
                                attempts: item.attempts + 1,
                                lastAttempt: Date.now()
                            }
                        });

                        failed++;
                        errors.push({ entityId: item.entityId, type: item.type, reason });
                        this.emitEvent('SYNC_ITEM_ERROR', item.type, {
                            entityId: item.entityId,
                            error: reason
                        });
                    }
                }

                // Ejecutar operaciones de base de datos por lote
                if (itemsToRemove.length > 0) {
                    await SyncAdapter.removeBatchFromQueue(itemsToRemove);
                }
                if (itemsToUpdate.length > 0) {
                    await SyncAdapter.updateBatchQueueItems(itemsToUpdate);
                }
            } catch (error: any) {
                const msg = error.message || 'Internal error';
                log.error(`Critical error processing group ${type}`, error);

                for (const item of group) {
                    failed++;
                    errors.push({ entityId: item.entityId, type: item.type, reason: msg });
                    await SyncAdapter.updateQueueItem(item.id, {
                        status: 'failed',
                        error: msg,
                        attempts: item.attempts + 1
                    });
                }
            }
        }

        return { succeeded, failed, errors };
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

        const { succeeded, failed } = await this.executeSyncCycle(
            pendingItems.slice(0, this.config.batchSize)
        );

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
