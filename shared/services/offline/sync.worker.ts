/**
 * Async Sync Worker
 *
 * Worker de sincronización que corre en segundo plano
 * sincronizando entidades con el backend usando estrategias especializadas.
 */

import { OfflineFinancialStorage } from './storage.service';
import NetInfo from '@react-native-community/netinfo';
import { isServerReachable } from '../../utils/network';
import {
    SyncQueueItem,
    SyncResult,
    DOMAIN_ENTITY_REGISTRY,
    DomainEntityConfig,
    SyncStrategy,
} from './types';
import { logger } from '../../utils/logger';
import {
    WorkerConfig,
    WorkerState,
    WorkerInternalState,
    defaultWorkerConfig,
    workerState,
    resetWorkerStats,
    incrementConsecutiveErrors,
    resetConsecutiveErrors,
    updateStats
} from './worker.state';
import {
    BetPushStrategy,
    DrawsPullStrategy,
    GenericPullStrategy,
    GenericPushStrategy,
    GenericSyncStrategy,
    LocalOnlyStrategy
} from './sync.strategies';

const log = logger.withTag('SYNC_WORKER');

// ============================================================================
// CALLBACKS Y EVENTOS
// ============================================================================

type SyncEventCallback = (event: {
    type: 'started' | 'completed' | 'error' | 'item_success' | 'item_error';
    itemId?: string;
    error?: string;
    result?: SyncResult;
}) => void;

let eventCallback: SyncEventCallback | null = null;

/**
 * Registra un callback para eventos de sincronización
 */
export function onSyncEvent(callback: SyncEventCallback): () => void {
    eventCallback = callback;
    return () => {
        eventCallback = null;
    };
}

/**
 * Emite un evento de sincronización
 */
function emitEvent(event: Parameters<SyncEventCallback>[0]): void {
    if (eventCallback) {
        try {
            eventCallback(event);
        } catch (error) {
            log.error('Error in event callback', error);
        }
    }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Espera un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica si hay conectividad de red de forma robusta
 */
async function checkConnectivity(): Promise<boolean> {
    workerState.isOnline = await isServerReachable();
    return workerState.isOnline;
}

/**
 * Calcula el intervalo adaptativo basado en el estado
 */
function getAdaptiveInterval(config: WorkerConfig): number {
    // Si hay errores consecutivos, aplicar backoff exponencial
    if (workerState.consecutiveErrors > 0) {
        return Math.min(config.retryBackoffBase * Math.pow(2, workerState.consecutiveErrors), 300000); // Max 5 min
    }

    // Intervalo normal
    return config.syncInterval;
}

// ============================================================================
// REGISTRO DE ESTRATEGIAS
// ============================================================================

// 1. Estrategias especializadas (Overrides por nombre de entidad)
const specializedStrategies: Record<string, SyncStrategy> = {
    'BETS': new BetPushStrategy(),
    'DRAWS': new DrawsPullStrategy(),
};

// 2. Estrategias genéricas (Fallbacks por tipo de sync)
const genericStrategies: Record<string, SyncStrategy> = {
    'PULL': new GenericPullStrategy(),
    'PUSH': new GenericPushStrategy(),
    'SYNC': new GenericSyncStrategy(),
    'LOCAL_ONLY': new LocalOnlyStrategy(),
};

function getStrategy(config: DomainEntityConfig): SyncStrategy {
    // 1. Prioridad: Estrategia especializada
    if (specializedStrategies[config.name]) {
        return specializedStrategies[config.name];
    }

    // 2. Fallback: Estrategia genérica basada en configuración
    const strategy = genericStrategies[config.syncStrategy];
    if (strategy) {
        return strategy;
    }

    // 3. Default absoluto
    log.warn(`No strategy found for ${config.name} (${config.syncStrategy}), using default PULL`);
    return genericStrategies['PULL'];
}

// ============================================================================
// LÓGICA DE SINCRONIZACIÓN
// ============================================================================

/**
 * Procesa un batch de items de la cola
 */
async function processBatch(config: WorkerConfig): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
    };

    try {
        if (!workerState.isOnline) return result;

        const pendingItems = await OfflineFinancialStorage.getPendingQueueItems();
        if (pendingItems.length === 0) {
            if (workerState.intervalId) {
                log.debug('Queue empty, entering idle mode');
                clearInterval(workerState.intervalId);
                workerState.intervalId = null;
            }
            return result;
        }

        if (!workerState.intervalId && workerState.state === 'running') {
            setupAdaptiveInterval(config);
        }

        const batch = pendingItems.slice(0, config.batchSize);
        log.debug('Processing sync batch', { batchSize: batch.length });

        for (const item of batch) {
            if ((workerState.state as string) === 'stopping' || !workerState.isOnline) break;

            result.processed++;

            // Identificar la entidad y su configuración desde el registry
            const entityKey = item.type.toUpperCase() === 'BET' ? 'BETS' : item.type.toUpperCase();
            const entityConfig = DOMAIN_ENTITY_REGISTRY[entityKey];

            if (entityConfig) {
                const strategy = getStrategy(entityConfig);
                const success = await strategy.sync(entityConfig, item, config);

                if (success) {
                    result.succeeded++;
                    emitEvent({ type: 'item_success', itemId: item.entityId });
                } else {
                    result.failed++;
                    emitEvent({ type: 'item_error', itemId: item.entityId, error: 'Sync failed' });
                }
                await sleep(100);
            } else {
                log.warn(`Unknown entity type in queue: ${item.type}`);
            }
        }

        updateStats(result.processed, result.succeeded, result.failed);

        return result;
    } catch (error: any) {
        log.error('Error processing batch', error);
        result.success = false;
        result.errors?.push({ itemId: 'batch', error: error.message || 'Batch processing error' });
        return result;
    }
}

/**
 * Ejecuta un ciclo de sincronización
 */
async function runSyncCycle(config: WorkerConfig): Promise<void> {
    if (workerState.state !== 'running' || !workerState.isOnline) {
        return;
    }

    try {
        emitEvent({ type: 'started' });
        await OfflineFinancialStorage.updateWorkerStatus('running');

        // 1. Procesar todas las entidades registradas con estrategia PULL
        // NOTA: Esto podría moverse a un "PullWorker" separado si crece mucho
        const pullEntities = Object.values(DOMAIN_ENTITY_REGISTRY).filter(e => e.syncStrategy === 'PULL');
        for (const entityConfig of pullEntities) {
            // Cast necesario porque TS piensa que el estado sigue siendo 'running' por el check inicial
            if ((workerState.state as string) === 'stopping' || !workerState.isOnline) break;
            const strategy = getStrategy(entityConfig);
            await strategy.sync(entityConfig);
        }

        // 2. Procesar cola de sincronización (Estrategia PUSH)
        const result = await processBatch(config);

        // BACKOFF LOGIC
        if (result.success) {
            // Si procesamos items y TODOS fallaron, incrementamos errores consecutivos
            if (result.processed > 0 && result.succeeded === 0 && result.failed > 0) {
                incrementConsecutiveErrors();
                log.warn(`All ${result.processed} items failed. Incremented consecutive errors to ${workerState.consecutiveErrors}`);
            } 
            // Si al menos uno tuvo éxito, reseteamos (o si no había nada que procesar)
            else if (result.succeeded > 0 || result.processed === 0) {
                if (workerState.consecutiveErrors > 0) {
                    log.info('Sync success/idle, resetting consecutive errors');
                    resetConsecutiveErrors();
                }
            }
        } else {
            // Error fatal en el batch (ej. storage error)
            incrementConsecutiveErrors();
            log.warn(`Batch processing failed. Incremented consecutive errors to ${workerState.consecutiveErrors}`);
        }

        emitEvent({
            type: result.success ? 'completed' : 'error',
            result,
        });
    } catch (error: any) {
        log.error('Sync cycle error', error);
        incrementConsecutiveErrors();
        emitEvent({
            type: 'error',
            error: error.message || 'Sync cycle error',
        });
        await OfflineFinancialStorage.recordSyncError(error.message || 'Sync cycle error');
    }
}

/**
 * Configura el intervalo adaptativo
 */
function setupAdaptiveInterval(config: WorkerConfig): void {
    if (workerState.intervalId) {
        clearInterval(workerState.intervalId);
    }

    const interval = getAdaptiveInterval(config);
    log.info(`Setting adaptive interval: ${interval}ms`);

    workerState.intervalId = setInterval(async () => {
        if (workerState.state === 'running' && workerState.isOnline) {
            workerState.currentPromise = runSyncCycle(config);
            await workerState.currentPromise;

            // Re-evaluar intervalo si hubo cambios en errores
            const currentInterval = getAdaptiveInterval(config);
            if (currentInterval !== interval) {
                setupAdaptiveInterval(config);
            }
        }
    }, interval);
}

// ============================================================================
// CONTROL DEL WORKER
// ============================================================================

/**
 * Inicia el worker de sincronización
 */
export async function startSyncWorker(userConfig?: Partial<WorkerConfig>): Promise<void> {
    const config = { ...defaultWorkerConfig, ...userConfig };

    // Si ya está corriendo o parando, ignorar
    if (workerState.state === 'running' || workerState.state === 'stopping') {
        log.warn('Worker already running or stopping');
        return;
    }

    workerState.state = 'running';

    // 1. Suscribirse a cambios de red (Network-Aware)
    if (!workerState.netInfoUnsubscribe) {
        workerState.netInfoUnsubscribe = NetInfo.addEventListener(async state => {
            const wasOnline = workerState.isOnline;

            // Re-verificar con ping real si el estado básico cambió
            if (state.isConnected) {
                workerState.isOnline = await isServerReachable();
            } else {
                workerState.isOnline = false;
            }

            if (workerState.isOnline && !wasOnline && workerState.state === 'running') {
                log.info('Network recovered, triggering immediate sync');
                runSyncCycle(config);
            }
        });
    }

    // 2. Verificar conectividad inicial
    await checkConnectivity();

    log.info('Starting SmartSync', { isOnline: workerState.isOnline });
    await OfflineFinancialStorage.updateWorkerStatus(workerState.isOnline ? 'running' : 'paused');

    // 3. Ejecutar inmediatamente el primer ciclo si hay internet
    if (workerState.isOnline) {
        workerState.currentPromise = runSyncCycle(config);
        await workerState.currentPromise;
    }

    // 4. Configurar intervalo adaptativo si hay items pendientes
    const pendingItems = await OfflineFinancialStorage.getPendingQueueItems();
    if (pendingItems.length > 0) {
        setupAdaptiveInterval(config);
    }
}

/**
 * Pausa el worker temporalmente
 */
export async function pauseSyncWorker(): Promise<void> {
    if (workerState.state !== 'running') {
        return;
    }

    workerState.state = 'paused';
    log.info('Worker paused');

    if (workerState.intervalId) {
        clearInterval(workerState.intervalId);
        workerState.intervalId = null;
    }

    await OfflineFinancialStorage.updateWorkerStatus('paused');
}

/**
 * Reanuda el worker
 */
export async function resumeSyncWorker(config?: Partial<WorkerConfig>): Promise<void> {
    if (workerState.state !== 'paused') {
        return;
    }

    workerState.state = 'running';
    log.info('Resumed');

    const fullConfig = { ...defaultWorkerConfig, ...config };

    // Verificar si necesitamos el intervalo
    const pendingItems = await OfflineFinancialStorage.getPendingQueueItems();
    if (pendingItems.length > 0) {
        setupAdaptiveInterval(fullConfig);
    }

    await OfflineFinancialStorage.updateWorkerStatus('running');
}

/**
 * Detiene el worker
 */
export async function stopSyncWorker(): Promise<void> {
    if (workerState.state === 'stopped' || workerState.state === 'idle') {
        return;
    }

    workerState.state = 'stopping';
    log.info('Stopping...');

    // Limpiar suscripción de red
    if (workerState.netInfoUnsubscribe) {
        workerState.netInfoUnsubscribe();
        workerState.netInfoUnsubscribe = null;
    }

    // Limpiar intervalo
    if (workerState.intervalId) {
        clearInterval(workerState.intervalId);
        workerState.intervalId = null;
    }

    // Esperar a que termine el ciclo actual
    if (workerState.currentPromise) {
        await workerState.currentPromise;
    }

    workerState.state = 'stopped';
    await OfflineFinancialStorage.updateWorkerStatus('idle');
    resetWorkerStats();

    log.info('Stopped');
}

/**
 * Fuerza una sincronización inmediata (Triggered by user or event)
 */
export async function forceSyncNow(config?: Partial<WorkerConfig>): Promise<SyncResult> {
    const fullConfig = { ...defaultWorkerConfig, ...config };

    // Si el worker estaba en idle, restaurar intervalo para el batch
    if (!workerState.intervalId && workerState.state === 'running' && workerState.isOnline) {
        setupAdaptiveInterval(fullConfig);
    }

    return processBatch(fullConfig);
}

// ============================================================================
// CONSULTA DE ESTADO
// ============================================================================

/**
 * Obtiene el estado actual del worker
 */
export function getWorkerState(): WorkerState {
    return workerState.state;
}

/**
 * Obtiene las estadísticas del worker
 */
export function getWorkerStats(): WorkerInternalState['stats'] {
    return { ...workerState.stats };
}

/**
 * Verifica si el worker está corriendo
 */
export function isWorkerRunning(): boolean {
    return workerState.state === 'running';
}

// ============================================================================
// LIMPIEZA DE RECURSOS
// ============================================================================

/**
 * Limpia todos los recursos del worker
 * Llamar al desmontar la aplicación
 */
export async function cleanupWorker(): Promise<void> {
    await stopSyncWorker();
    eventCallback = null;
    resetWorkerStats();
}
