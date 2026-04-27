import {
    SyncQueueItem,
    SyncOutcome,
    SyncStrategy,
    WorkerStatus,
    WorkerConfig,
    DomainEvent,
    SYNC_CONSTANTS,
    SyncReport,
    SyncBreakdown
} from '../types';
import { logger } from '../../../utils/logger';
import { SyncAdapter } from './adapter';
import { workerState, WorkerStateManager } from './worker.state';
import { isServerReachable } from '../../../utils/network';
import { offlineEventBus } from '../event_bus';

const log = logger.withTag('SYNC_WORKER_CORE');

/**
 * Circuit Breaker state per entity type
 */
const entityCircuitBreaker: Record<string, { consecutiveFailures: number; isPaused: boolean }> = {};
const CIRCUIT_BREAKER_THRESHOLD = 3;

const MAX_CONCURRENT = 3;

async function processWithConcurrency<T>(
    items: SyncQueueItem[],
    processor: (item: SyncQueueItem) => Promise<T>
): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < items.length; i += MAX_CONCURRENT) {
        const batch = items.slice(i, i + MAX_CONCURRENT);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
    }
    return results;
} // Pausar entidad si falla 3 veces consecutivas

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
        return this.forceSync();
    }

    async forceSync(entityType?: string): Promise<SyncReport> {
        const startTime = Date.now();
        const errors: { entityId: string; type: string; reason: string }[] = [];

        if (workerState.currentPromise) {
            log.debug('[DEBUG_SYNC_WORKER] Sync already in progress, checking for urgent items...');
            const urgentItems = await SyncAdapter.getUrgentItems();
            if (urgentItems.length > 0) {
                log.info(`[SYNC-WORKER] PREEMPTION: ${urgentItems.length} urgent items, processing immediately`);
                WorkerStateManager.setStatus('running');
                this.emitEvent('SYNC_STARTED', 'system');
                const { succeeded, failed, errors: urgentErrors, breakdown: urgentBreakdown } = await this.executeSyncCycle(urgentItems);
                errors.push(...urgentErrors);
                const report: SyncReport = {
                    timestamp: Date.now(),
                    status: failed === 0 ? 'SUCCESS' : 'PARTIAL',
                    processed: succeeded + failed,
                    succeeded,
                    failed,
                    breakdown: urgentBreakdown,
                    errors,
                    duration: Date.now() - startTime
                };
                WorkerStateManager.updateStats(succeeded + failed, succeeded, failed);
                WorkerStateManager.setStatus('idle');
                this.emitEvent('SYNC_COMPLETED', 'system', report);
                return report;
            }
            return workerState.currentPromise;
        }

        const run = async (): Promise<SyncReport> => {
            log.debug(`[DEBUG_SYNC_WORKER] Manual trigger started - isOnline: ${await isServerReachable()}`);
            const isOnline = await isServerReachable();
            WorkerStateManager.setOnline(isOnline);

            if (!isOnline) {
                log.debug('[DEBUG_SYNC_WORKER] Worker is offline, skipping sync');
                return {
                    timestamp: Date.now(),
                    status: 'OFFLINE',
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    breakdown: {},
                    errors: [],
                    duration: Date.now() - startTime
                };
            }

            const allPendingItems = await SyncAdapter.getPendingItems();
            const pendingItems = entityType
                ? allPendingItems.filter((item) => item.type.toLowerCase() === entityType.toLowerCase())
                : allPendingItems;
            if (pendingItems.length === 0) {
                return {
                    timestamp: Date.now(),
                    status: 'NO_ITEMS',
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    breakdown: {},
                    errors: [],
                    duration: Date.now() - startTime
                };
            }

            log.info(`[SYNC-WORKER-DIAGNOSTIC] Manual sync started: ${pendingItems.length} items found.`);
            WorkerStateManager.setStatus('running');
            this.emitEvent('SYNC_STARTED', 'system');

            const { succeeded, failed, errors: batchErrors, breakdown } = await this.executeSyncCycle(
                pendingItems.slice(0, this.config.batchSize)
            );

            log.info(`[SYNC-WORKER-DIAGNOSTIC] Cycle finished: succeeded=${succeeded}, failed=${failed}`);
            errors.push(...batchErrors);

            const finalStatus = failed === 0 ? 'SUCCESS' : (succeeded > 0 ? 'PARTIAL' : 'FAILED');
            const report: SyncReport = {
                timestamp: Date.now(),
                status: finalStatus,
                processed: succeeded + failed,
                succeeded,
                failed,
                breakdown,
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
        breakdown: SyncBreakdown;
    }> {
        let succeeded = 0;
        let failed = 0;
        const errors: { entityId: string; type: string; reason: string }[] = [];
        const breakdown: SyncBreakdown = {};

        // Deduplicación: Mantener solo el último item por entityId (Bug 3 fix - previene ciclos infinitos)
        const entityIdSeen = new Set<string>();
        const dedupedItems = items.filter(item => {
            if (entityIdSeen.has(item.entityId)) {
                log.debug(`[SYNC-WORKER] Deduplicating duplicate entityId: ${item.entityId} (${item.type})`);
                return false;
            }
            entityIdSeen.add(item.entityId);
            return true;
        });

        // Agrupar ítems por tipo para aprovechar pushBatch
        const groups = dedupedItems.reduce((acc, item) => {
            const type = item.type.toLowerCase();
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {} as Record<string, SyncQueueItem[]>);

        log.info(`[SYNC-WORKER-DIAGNOSTIC] Grouped items into ${Object.keys(groups).length} types: ${Object.keys(groups).join(', ')}`);

        for (const [type, group] of Object.entries(groups)) {
            // Circuit Breaker: Si la entidad está pausada, saltar todo el grupo
            const breaker = entityCircuitBreaker[type] || { consecutiveFailures: 0, isPaused: false };
            if (breaker.isPaused) {
                log.warn(`[SYNC-WORKER] Circuit breaker ACTIVE for ${type}, skipping ${group.length} items`);
                // Mover todos a pending pero no procesarlos
                await SyncAdapter.updateBatchQueueItems(group.map(item => ({
                    id: item.id,
                    data: { status: 'pending', error: 'Circuit breaker active' }
                })));
                continue;
            }

            const strategy = this.strategies.get(type);

            if (!strategy) {
                log.warn(`[SYNC-WORKER-DIAGNOSTIC] No strategy found for entity type: ${type}`);
                for (const item of group) {
                    failed++;
                    const reason = `No strategy for ${type}`;
                    errors.push({ entityId: item.entityId, type: item.type, reason });
                    await SyncAdapter.updateQueueItem(item.id, { status: 'failed', error: reason });
                }
                continue;
            }

            try {
                log.debug(`[SYNC-WORKER-DIAGNOSTIC] Processing group ${type} with ${group.length} items`);
                // Marcar todos como en procesamiento por lote
                await SyncAdapter.updateBatchQueueItems(group.map(item => ({
                    id: item.id,
                    data: { status: 'processing' }
                })));

                let outcomes: SyncOutcome[][];
                let flatOutcomes: SyncOutcome[];

                if (strategy.pushBatch && group.length > 1) {
                    log.info(`[SYNC-WORKER-DIAGNOSTIC] Using pushBatch for ${type} (${group.length} items)`);
                    const batchResults = await strategy.pushBatch(group);
                    outcomes = batchResults.map(r => [r]);
                    flatOutcomes = batchResults;
                } else if (strategy.push) {
                    log.info(`[SYNC-WORKER-DIAGNOSTIC] Using sequential push for ${type} (${group.length} items)`);
                    outcomes = await processWithConcurrency(group, (item) =>
                        strategy.push!(item).then(result => [result])
                    );
                    flatOutcomes = outcomes.flat() as SyncOutcome[];
                } else {
                    throw new Error(`Strategy for ${type} does not support push or pushBatch`);
                }

                log.debug(`[SYNC-WORKER-DIAGNOSTIC] Processing ${flatOutcomes.length} outcomes for ${type}`);

                // Actualizar Circuit Breaker según resultados del batch
                const fatalCount = flatOutcomes.filter(o => o.type === 'FATAL_ERROR').length;
                const successCount = flatOutcomes.filter(o => o.type === 'SUCCESS').length;

                if (fatalCount === flatOutcomes.length) {
                    // TODOS fatales en este batch: activar circuit breaker para esta entidad
                    breaker.consecutiveFailures += 1;
                    if (breaker.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
                        breaker.isPaused = true;
                        log.error(`[SYNC-WORKER] Circuit breaker TRIPPED for ${type} after ${breaker.consecutiveFailures} consecutive fatal batches`);
                    }
                } else if (successCount > 0) {
                    // Al menos uno tuvo éxito: reiniciar circuit breaker
                    breaker.consecutiveFailures = 0;
                    breaker.isPaused = false;
                }
                entityCircuitBreaker[type] = breaker;

                // Preparar actualizaciones y eliminaciones por lote
                const itemsToRemove: string[] = [];
                const itemsToUpdate: { id: string, data: Partial<SyncQueueItem> }[] = [];

                for (let i = 0; i < group.length; i++) {
                    const item = group[i];
                    const outcome = flatOutcomes[i];

                    if (outcome.type === 'SUCCESS') {
                        log.info(`[SYNC-WORKER-DIAGNOSTIC] SUCCESS: ${item.type}/${item.entityId} -> BackendID: ${outcome.backendId || 'N/A'}`);
                        itemsToRemove.push(item.id);
                        succeeded++;
                        breakdown[item.type] = (breakdown[item.type] || 0) + 1;
                        this.emitEvent('SYNC_ITEM_SUCCESS', item.type, {
                            entityId: item.entityId,
                            backendId: outcome.backendId
                        });
                    } else if (outcome.type === 'RETRY_LATER') {
                        log.warn(`[SYNC-WORKER-DIAGNOSTIC] RETRY_LATER: ${item.type}/${item.entityId}. Reason: ${outcome.reason}`);
                        itemsToUpdate.push({
                            id: item.id,
                            data: {
                                status: 'pending',
                                error: outcome.reason,
                                attempts: item.attempts + 1,
                                lastAttempt: Date.now()
                            }
                        });
                        failed++;
                    } else {
                        const reason = outcome.reason || 'Unknown error';
                        const isFatal = outcome.type === 'FATAL_ERROR';
                        log.error(`[SYNC-WORKER-DIAGNOSTIC] FAILED: ${item.type}/${item.entityId}. Fatal: ${isFatal}, Reason: ${reason}`);

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
                            error: reason,
                            isFatal,
                            attempts: item.attempts + 1
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

        return { succeeded, failed, errors, breakdown };
    }

    private async processQueue(): Promise<void> {
        log.warn('[SYNC_WORKER] processQueue was called but it should be disabled for auto-triggers');
        return;

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
