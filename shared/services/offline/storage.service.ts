/**
 * Servicio de almacenamiento offline para estados financieros
 * 
 * Extiende la funcionalidad de OfflineStorage existente
 * manteniendo compatibilidad hacia atrás.
 */

import storageClient from '../storage_client';
import {
    PendingBetV2,
    DrawFinancialState,
    SyncQueueItem,
    SyncMetadata,
    OFFLINE_STORAGE_KEYS,
    WorkerStatus,
    DOMAIN_ENTITY_REGISTRY,
    DomainEntityConfig,
    DomainEvent,
    DomainEventCallback,
    Unsubscribe,
} from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('OFFLINE_STORAGE_V2');

// ============================================================================
// BUS DE EVENTOS INTERNO
// ============================================================================

const subscribers = new Set<DomainEventCallback>();

/**
 * Suscribe un callback a eventos de dominio
 */
function subscribe(callback: DomainEventCallback): Unsubscribe {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Emite un evento a todos los suscriptores
 */
function emitEvent(event: Omit<DomainEvent, 'timestamp'>): void {
    const fullEvent: DomainEvent = {
        ...event,
        timestamp: Date.now(),
    };

    subscribers.forEach(callback => {
        try {
            callback(fullEvent);
        } catch (error) {
            log.error('Error in event subscriber', error);
        }
    });
}

// ============================================================================
// CONSTANTES INTERNAS
// ============================================================================

const STORAGE_VERSION = 'v2';
const VERSION_KEY = '@offline_storage_version';

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene el timestamp actual
 */
const now = (): number => Date.now();

/**
 * Genera un UUID v4
 */
const generateId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// ============================================================================
// MIGRACIÓN DE DATOS
// ============================================================================

/**
 * Verifica y realiza migración de datos si es necesario
 */
async function checkMigration(): Promise<void> {
    try {
        const currentVersion = await storageClient.get<string>(VERSION_KEY);

        if (currentVersion !== STORAGE_VERSION) {
            log.info(`Migrating from ${currentVersion || 'v1'} to ${STORAGE_VERSION}`);

            // Migración de V1 a V2 si no existe V2
            const v2Data = await storageClient.get(OFFLINE_STORAGE_KEYS.PENDING_BETS_V2);
            if (!v2Data) {
                const v1Data = await storageClient.get<any[]>('@pending_bets');
                if (v1Data) {
                    const legacyBets = v1Data;
                    if (Array.isArray(legacyBets) && legacyBets.length > 0) {
                        log.info('Migrating legacy bets to V2', { count: legacyBets.length });

                        const migratedBets: PendingBetV2[] = legacyBets.map(bet => ({
                            ...bet,
                            status: bet.status === 'synced' ? 'synced' : 'pending',
                            retryCount: 0,
                            // El impacto financiero se recalculará al cargar si es necesario
                        }));

                        await storageClient.set(OFFLINE_STORAGE_KEYS.PENDING_BETS_V2, migratedBets);

                        // También migrar a la cola de sincronización si están pendientes
                        const queueItems: SyncQueueItem[] = migratedBets
                            .filter(b => b.status === 'pending')
                            .map(b => ({
                                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                type: 'bet',
                                entityId: b.offlineId,
                                priority: 1,
                                createdAt: Date.now(),
                                attempts: 0,
                                status: 'pending'
                            }));

                        if (queueItems.length > 0) {
                            const existingQueue = await getSyncQueue();
                            await storageClient.set(OFFLINE_STORAGE_KEYS.SYNC_QUEUE, [...existingQueue, ...queueItems]);
                        }

                        log.info('Migration completed successfully', { migratedCount: migratedBets.length });
                    }
                }
            }

            await storageClient.set(VERSION_KEY, STORAGE_VERSION);
        }
    } catch (error) {
        log.error('Migration check failed', error);
    }
}

// ============================================================================
// PENDING BETS V2
// ============================================================================

/**
 * Obtiene todas las apuestas pendientes (formato V2)
 */
async function getPendingBetsV2(): Promise<PendingBetV2[]> {
    const data = await storageClient.get<PendingBetV2[]>(OFFLINE_STORAGE_KEYS.PENDING_BETS_V2);
    if (!data) return [];

    // Validar que sea un array
    if (!Array.isArray(data)) {
        log.warn('Pending bets data is not an array, resetting');
        return [];
    }

    return data;
}

/**
 * Guarda una apuesta pendiente
 */
async function savePendingBetV2(bet: PendingBetV2): Promise<void> {
    const bets = await getPendingBetsV2();

    // Verificar límite de apuestas
    const pendingCount = bets.filter(b => b.status !== 'synced').length;
    if (pendingCount >= 500) {
        throw new Error('Maximum offline bets limit reached (500)');
    }

    // Agregar o actualizar
    const existingIndex = bets.findIndex(b => b.offlineId === bet.offlineId);
    if (existingIndex >= 0) {
        bets[existingIndex] = { ...bets[existingIndex], ...bet };
    } else {
        bets.push(bet);
    }

    await storageClient.set(OFFLINE_STORAGE_KEYS.PENDING_BETS_V2, bets);
}

/**
 * Actualiza una apuesta pendiente
 */
async function updatePendingBetV2(
    offlineId: string,
    updates: Partial<PendingBetV2>
): Promise<void> {
    const bets = await getPendingBetsV2();
    const index = bets.findIndex(b => b.offlineId === offlineId);

    if (index >= 0) {
        bets[index] = { ...bets[index], ...updates, offlineId };
        await storageClient.set(OFFLINE_STORAGE_KEYS.PENDING_BETS_V2, bets);
    }
}

/**
 * Elimina una apuesta pendiente
 */
async function removePendingBetV2(offlineId: string): Promise<void> {
    const bets = await getPendingBetsV2();
    const filtered = bets.filter(b => b.offlineId !== offlineId);
    await storageClient.set(OFFLINE_STORAGE_KEYS.PENDING_BETS_V2, filtered);
}

/**
 * Obtiene apuestas por sorteo
 */
async function getPendingBetsByDrawV2(drawId: string): Promise<PendingBetV2[]> {
    const bets = await getPendingBetsV2();
    return bets.filter(bet => {
        const betDrawId = (bet.draw || bet.drawId)?.toString();
        return betDrawId === drawId;
    });
}

/**
 * Obtiene apuestas por estado
 */
async function getPendingBetsByStatusV2(status: PendingBetV2['status']): Promise<PendingBetV2[]> {
    const bets = await getPendingBetsV2();
    return bets.filter(bet => bet.status === status);
}

// ============================================================================
// DRAW FINANCIAL STATES
// ============================================================================

/**
 * Obtiene el estado financiero de un sorteo
 */
async function getDrawState(drawId: string): Promise<DrawFinancialState | null> {
    const states = await storageClient.get<Record<string, DrawFinancialState>>(OFFLINE_STORAGE_KEYS.DRAW_FINANCIAL_STATES);
    if (!states) return null;
    return states[drawId] || null;
}

/**
 * Guarda el estado financiero de un sorteo
 */
async function saveDrawState(state: DrawFinancialState): Promise<void> {
    const states = await storageClient.get<Record<string, DrawFinancialState>>(OFFLINE_STORAGE_KEYS.DRAW_FINANCIAL_STATES) || {};

    states[state.drawId] = {
        ...state,
        lastUpdated: now(),
    };

    await storageClient.set(OFFLINE_STORAGE_KEYS.DRAW_FINANCIAL_STATES, states);
}

/**
 * Obtiene todos los estados financieros
 */
async function getAllDrawStates(): Promise<Record<string, DrawFinancialState>> {
    const states = await storageClient.get<Record<string, DrawFinancialState>>(OFFLINE_STORAGE_KEYS.DRAW_FINANCIAL_STATES);
    return states || {};
}

/**
 * Elimina el estado financiero de un sorteo
 */
async function removeDrawState(drawId: string): Promise<void> {
    const states = await storageClient.get<Record<string, DrawFinancialState>>(OFFLINE_STORAGE_KEYS.DRAW_FINANCIAL_STATES);
    if (!states) return;

    delete states[drawId];
    await storageClient.set(OFFLINE_STORAGE_KEYS.DRAW_FINANCIAL_STATES, states);
}

// ============================================================================
// SYNC QUEUE
// ============================================================================

/**
 * Obtiene todos los items de la cola
 */
async function getSyncQueue(): Promise<SyncQueueItem[]> {
    const queue = await storageClient.get<SyncQueueItem[]>(OFFLINE_STORAGE_KEYS.SYNC_QUEUE);
    return queue || [];
}

/**
 * Agrega un item a la cola
 */
async function addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<string> {
    const queue = await getSyncQueue();

    const newItem: SyncQueueItem = {
        ...item,
        id: generateId(),
        createdAt: now(),
    };

    queue.push(newItem);
    await storageClient.set(OFFLINE_STORAGE_KEYS.SYNC_QUEUE, queue);

    return newItem.id;
}

/**
 * Actualiza un item en la cola
 */
async function updateQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const queue = await getSyncQueue();
    const index = queue.findIndex(item => item.id === id);

    if (index >= 0) {
        queue[index] = { ...queue[index], ...updates };
        await storageClient.set(OFFLINE_STORAGE_KEYS.SYNC_QUEUE, queue);
    }
}

/**
 * Elimina un item de la cola
 */
async function removeFromQueue(id: string): Promise<void> {
    const queue = await getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await storageClient.set(OFFLINE_STORAGE_KEYS.SYNC_QUEUE, filtered);
}

/**
 * Obtiene items pendientes ordenados por prioridad.
 * También incluye items en 'processing' que podrían haber quedado huérfanos
 * por un cierre inesperado de la app (stale items).
 */
async function getPendingQueueItems(): Promise<SyncQueueItem[]> {
    const queue = await getSyncQueue();
    const STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutos
    const now = Date.now();

    return queue
        .filter(item => {
            if (item.status === 'pending') return true;

            // Recuperar items que se quedaron en 'processing' hace más de 5 min
            if (item.status === 'processing' && item.lastAttempt) {
                return (now - item.lastAttempt) > STALE_TIMEOUT;
            }

            return false;
        })
        .sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// SYNC METADATA
// ============================================================================

/**
 * Obtiene los metadatos de sincronización
 */
async function getSyncMetadata(): Promise<SyncMetadata> {
    const defaultMetadata: SyncMetadata = {
        totalSyncs: 0,
        totalErrors: 0,
        workerStatus: 'idle',
    };

    const data = await storageClient.get<SyncMetadata>(OFFLINE_STORAGE_KEYS.SYNC_METADATA);
    return data ? { ...defaultMetadata, ...data } : defaultMetadata;
}

/**
 * Actualiza los metadatos de sincronización
 */
async function updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
    const metadata = await getSyncMetadata();
    const updated = { ...metadata, ...updates };
    await storageClient.set(OFFLINE_STORAGE_KEYS.SYNC_METADATA, updated);
}

/**
 * Registra una sincronización exitosa
 */
async function recordSuccessfulSync(): Promise<void> {
    const metadata = await getSyncMetadata();
    await updateSyncMetadata({
        totalSyncs: metadata.totalSyncs + 1,
        lastSuccessfulSync: now(),
    });
}

/**
 * Registra un error de sincronización
 */
async function recordSyncError(error: string): Promise<void> {
    const metadata = await getSyncMetadata();
    await updateSyncMetadata({
        totalErrors: metadata.totalErrors + 1,
        lastWorkerError: error,
    });
}

/**
 * Actualiza el estado del worker
 */
async function updateWorkerStatus(status: WorkerStatus): Promise<void> {
    const updates: Partial<SyncMetadata> = { workerStatus: status };

    if (status === 'running') {
        updates.workerStartedAt = now();
    }

    await updateSyncMetadata(updates);
}

// ============================================================================
// LIMPIEZA Y MANTENIMIENTO
// ============================================================================

/**
 * Limpia apuestas sincronizadas antiguas
 */
async function cleanupSyncedBets(maxAgeDays: number = 7): Promise<number> {
    const bets = await getPendingBetsV2();
    const cutoff = now() - (maxAgeDays * 24 * 60 * 60 * 1000);

    const toKeep = bets.filter(bet => {
        // Mantener si no está sync o si es reciente
        if (bet.status !== 'synced') return true;
        if (!bet.syncedAt) return true;
        return bet.syncedAt > cutoff;
    });

    const removed = bets.length - toKeep.length;

    if (removed > 0) {
        await storageClient.set(OFFLINE_STORAGE_KEYS.PENDING_BETS_V2, toKeep);
        log.info(`Cleaned up ${removed} old synced bets`);
    }

    return removed;
}

/**
 * Limpia items completados de la cola
 */
async function cleanupCompletedQueueItems(maxAgeHours: number = 24): Promise<number> {
    const queue = await getSyncQueue();
    const cutoff = now() - (maxAgeHours * 60 * 60 * 1000);

    const toKeep = queue.filter(item => {
        if (item.status !== 'completed') return true;
        if (!item.lastAttempt) return true;
        return item.lastAttempt > cutoff;
    });

    const removed = queue.length - toKeep.length;

    if (removed > 0) {
        await storageClient.set(OFFLINE_STORAGE_KEYS.SYNC_QUEUE, toKeep);
        log.info(`Cleaned up ${removed} completed queue items`);
    }

    return removed;
}

/**
 * Limpia estados financieros de sorteos antiguos
 */
async function cleanupOldDrawStates(maxAgeDays: number = 30): Promise<number> {
    const states = await getAllDrawStates();
    const cutoff = now() - (maxAgeDays * 24 * 60 * 60 * 1000);

    const entries = Object.entries(states);
    const toKeep = entries.filter(([_, state]) => state.lastUpdated > cutoff);

    if (toKeep.length < entries.length) {
        const newStates = Object.fromEntries(toKeep);
        await storageClient.set(OFFLINE_STORAGE_KEYS.DRAW_FINANCIAL_STATES, newStates);
    }

    const removed = entries.length - toKeep.length;
    log.info(`Cleaned up ${removed} old draw states`);
    return removed;
}

/**
 * Ejecuta mantenimiento completo
 */
async function runMaintenance(): Promise<{
    betsCleaned: number;
    queueCleaned: number;
    statesCleaned: number;
}> {
    await checkMigration();

    const [betsCleaned, queueCleaned, statesCleaned] = await Promise.all([
        cleanupSyncedBets(),
        cleanupCompletedQueueItems(),
        cleanupOldDrawStates(),
    ]);

    return { betsCleaned, queueCleaned, statesCleaned };
}

// ============================================================================
// MOTOR DE ALMACENAMIENTO GENÉRICO (REPOSITORY ENGINE)
// ============================================================================

/**
 * Obtiene datos de cualquier entidad registrada en el dominio
 */
async function getEntityData<T>(entityName: string): Promise<T | null> {
    const config = DOMAIN_ENTITY_REGISTRY[entityName];
    if (!config) {
        log.error(`Entity ${entityName} not found in registry`);
        return null;
    }

    const parsed = await storageClient.get<{ data: T, timestamp: number }>(config.storageKey);
    if (!parsed) return null;

    // Lógica genérica de expiración diaria para datos tipo PULL (ej: Sorteos)
    if (config.syncStrategy === 'PULL') {
        const savedDate = new Date(parsed.timestamp);
        const currentDate = new Date();
        const isSameDay = savedDate.getDate() === currentDate.getDate() &&
            savedDate.getMonth() === currentDate.getMonth() &&
            savedDate.getFullYear() === currentDate.getFullYear();

        if (!isSameDay) {
            log.info(`Entity ${entityName} expired (new day).`);
            return null;
        }
    }

    return parsed.data;
}

/**
 * Notifica cambios en una entidad y dispara efectos secundarios automáticos
 */
async function notifyEntityChange(entityName: string, data: any): Promise<void> {
    // 1. Emitir evento al bus interno
    emitEvent({
        type: 'ENTITY_CHANGED',
        entity: entityName,
        payload: data
    });

    // 2. Lógica reactiva específica por entidad (Business Rules)
    if (entityName === 'BETS') {
        // Al cambiar las apuestas, recalculamos el summary local automáticamente
        // Esto mantiene el Summary sincronizado sin intervención manual de la UI
        log.debug('Reactively updating SUMMARY due to BETS change');

        // Aquí iría la llamada a un servicio de cálculo de summary
        // Por ahora lo dejamos como hook para la siguiente fase
        // const summary = await FinancialSummaryService.calculateFromBets(data);
        // await saveSummary(summary);
    }
}

/**
 * Guarda datos para cualquier entidad registrada en el dominio
 */
async function saveEntityData<T>(entityName: string, data: T): Promise<void> {
    const config = DOMAIN_ENTITY_REGISTRY[entityName];
    if (!config) {
        log.error(`Entity ${entityName} not found in registry`);
        return;
    }

    const transformedData = config.transform ? config.transform(data) : data;

    await storageClient.set(config.storageKey, {
        data: transformedData,
        timestamp: Date.now()
    });

    // Notificar cambios y disparar efectos reactivos
    await notifyEntityChange(entityName, transformedData);
}


/**
 * Elimina datos de una entidad
 */
async function removeEntityData(entityName: string): Promise<void> {
    const config = DOMAIN_ENTITY_REGISTRY[entityName];
    if (config) {
        await storageClient.remove(config.storageKey);
    }
}

// ============================================================================
// PENDING BETS (LEGACY WRAPPERS)
// ============================================================================

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el storage offline
 */
async function initialize(): Promise<void> {
    await checkMigration();
    log.info('Initialized successfully');
}

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export const OfflineFinancialStorage = {
    // Inicialización
    initialize,

    // Pending Bets V2
    getPendingBetsV2,
    savePendingBetV2,
    updatePendingBetV2,
    removePendingBetV2,
    getPendingBetsByDrawV2,
    getPendingBetsByStatusV2,

    // Draw Financial States
    getDrawState,
    saveDrawState,
    getAllDrawStates,
    removeDrawState,

    // Sync Queue
    getSyncQueue,
    addToQueue,
    updateQueueItem,
    removeFromQueue,
    getPendingQueueItems,

    // Sync Metadata
    getSyncMetadata,
    updateSyncMetadata,
    recordSuccessfulSync,
    recordSyncError,
    updateWorkerStatus,

    // Mantenimiento
    cleanupSyncedBets,
    cleanupCompletedQueueItems,
    cleanupOldDrawStates,
    runMaintenance,

    // Bus de Eventos
    subscribe,

    // Motor Genérico (Domain-Agnostic)
    getEntityData,
    saveEntityData,
    removeEntityData,

    // Sorteos (Single Source of Truth) - Ahora usando motor genérico
    saveDraws: async (draws: any[]): Promise<void> => {
        await saveEntityData('DRAWS', draws);
    },

    getDraws: async (): Promise<any[] | null> => {
        return getEntityData<any[]>('DRAWS');
    },

    // Summary (Single Source of Truth) - Ahora usando motor genérico
    saveSummary: async (summary: any): Promise<void> => {
        await saveEntityData('SUMMARY', summary);
    },

    getSummary: async (): Promise<any | null> => {
        return getEntityData<any>('SUMMARY');
    },
};
