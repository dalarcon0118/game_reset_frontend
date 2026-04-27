import { offlineStorage } from '../storage';
import { OfflineStorageKeyManager } from '../utils';
import { SyncQueueItem, SyncMetadata, SYNC_CONSTANTS } from '../types';
import logger from '@/shared/utils/logger';

const log = logger.withTag('SyncAdapter');

/**
 * Adaptador de infraestructura para gestionar la cola de sincronización global.
 * Esta pieza es agnóstica al dominio y gestiona el mecanismo de reintentos y prioridad.
 */
export const SyncAdapter = {
    /**
     * Obtiene el conteo actual de items en la cola
     */
    async getQueueCount(): Promise<number> {
        const pattern = OfflineStorageKeyManager.getPattern('system', 'sync_queue', '*', 'data');
        return offlineStorage.query<SyncQueueItem>(pattern).count();
    },

    /**
     * Obtiene todos los items de la cola
     */
    async getQueue(): Promise<SyncQueueItem[]> {
        const pattern = OfflineStorageKeyManager.getPattern('system', 'sync_queue', '*', 'data');
        return await offlineStorage.query<SyncQueueItem>(pattern).all();
    },

    /**
     * Agrega un item a la cola con quota enforcement.
     * Si la cola está llena, limpia items exhaustos o antiguos primero.
     * @returns id del item agregado, o null si la cola está llena
     */
    async addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<string | null> {
        const maxItems = SYNC_CONSTANTS.MAX_SYNC_QUEUE_ITEMS;
        const queue = await this.getQueue();

        // Si la cola está llena, intentar cleanup
        if (queue.length >= maxItems) {
            log.warn(`[SyncAdapter] Queue at capacity (${queue.length}/${maxItems}). Attempting cleanup...`);
            
            // 1. Marcar exhaust los que excedieron retries
            await this.markExhaustedItems();
            
            // 2. Limpiar exhaustos inmediatamente
            await this.cleanup(0, 0);
            
            // 3. Si aún está llena, limpiar completed antiguos y los más antiguos
            const stillFull = await this.getQueueCount() >= maxItems;
            if (stillFull) {
                const remaining = await this.getQueue();
                const toDelete: string[] = [];
                
                // Limpiar completed (sin límite de días cuando hay presión)
                for (const item of remaining) {
                    if (item.status === 'completed' || item.status === 'exhausted') {
                        toDelete.push(item.id);
                    }
                }
                
                // Si aún lleno, limpiar los más antiguos (LIFO: oldest first)
                if (toDelete.length < (queue.length - maxItems + 1)) {
                    const pendingItems = remaining
                        .filter(i => i.status === 'pending' || i.status === 'failed')
                        .sort((a, b) => a.createdAt - b.createdAt);
                    
                    const slotsNeeded = queue.length - maxItems + 1 - toDelete.length;
                    for (let i = 0; i < slotsNeeded && i < pendingItems.length; i++) {
                        if (!toDelete.includes(pendingItems[i].id)) {
                            toDelete.push(pendingItems[i].id);
                        }
                    }
                }
                
                if (toDelete.length > 0) {
                    log.warn(`[SyncAdapter] Emergency cleanup: removing ${toDelete.length} items to free space`);
                    await this.removeBatchFromQueue(toDelete);
                }
            }
        }

        // Verificar nuevamente después del cleanup
        const currentCount = await this.getQueueCount();
        if (currentCount >= maxItems) {
            log.error(`[SyncAdapter] Queue FULL (${currentCount}/${maxItems}). Rejecting new item.`, {
                itemType: item.type,
                entityId: item.entityId
            });
            return null; // Backpressure: rechazar nuevo item
        }

        console.log(`[DEBUG_SYNC_ADAPTER] Adding to queue: ${item.type}`, { entityId: item.entityId });
        const id = Math.random().toString(36).substring(2, 11);
        const newItem: SyncQueueItem = {
            ...item,
            id,
            createdAt: Date.now(),
            status: 'pending',
            attempts: 0
        };

        const key = OfflineStorageKeyManager.generateKey('system', 'sync_queue', id);
        await offlineStorage.set(key, newItem);
        log.debug(`[SyncAdapter] Item added to queue (${currentCount + 1}/${maxItems})`);
        return id;
    },

    /**
     * Actualiza un item de la cola
     */
    async updateQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
        const key = OfflineStorageKeyManager.generateKey('system', 'sync_queue', id);
        const item = await offlineStorage.get<SyncQueueItem>(key);
        if (item) {
            await offlineStorage.set(key, { ...item, ...updates });
        }
    },

    /**
     * Elimina un item de la cola
     */
    async removeFromQueue(id: string): Promise<void> {
        const key = OfflineStorageKeyManager.generateKey('system', 'sync_queue', id);
        await offlineStorage.remove(key);
    },

    /**
     * Elimina varios items de la cola por lote
     */
    async removeBatchFromQueue(ids: string[]): Promise<void> {
        const keys = ids.map(id => OfflineStorageKeyManager.generateKey('system', 'sync_queue', id));
        await offlineStorage.removeMulti(keys);
    },

    /**
     * Actualiza varios items de la cola por lote
     */
    async updateBatchQueueItems(updates: { id: string, data: Partial<SyncQueueItem> }[]): Promise<void> {
        const entries: { key: string, data: SyncQueueItem }[] = [];

        for (const update of updates) {
            const key = OfflineStorageKeyManager.generateKey('system', 'sync_queue', update.id);
            const item = await offlineStorage.get<SyncQueueItem>(key);
            if (item) {
                entries.push({ key, data: { ...item, ...update.data } });
            }
        }

        if (entries.length > 0) {
            await offlineStorage.setMulti(entries);
        }
    },

    /**
     * Obtiene items pendientes ordenados por prioridad.
     * Filtra automáticamente ítems que han excedido MAX_RETRIES.
     * NUNCA resetea attempts. Los estados son permanentes.
     */
    async getPendingItems(): Promise<SyncQueueItem[]> {
        const queue = await this.getQueue();
        const maxRetries = SYNC_CONSTANTS.MAX_RETRIES;

        const pending = queue
            .filter(item => {
                // Ignorar ítems completados o exhaustos (estados terminales)
                if (item.status === 'completed' || item.status === 'exhausted') {
                    return false;
                }

                // CRÍTICO: Si excedió el límite de reintentos, marcar como exhausted
                if (item.attempts >= maxRetries) {
                    log.debug(`Item ${item.entityId} exceeded max retries (${item.attempts}/${maxRetries}), marking exhausted`);
                    // Actualización asíncrona en background para no bloquear
                    this.updateQueueItem(item.id, { status: 'exhausted' }).catch(e => 
                        console.error('[SyncAdapter] Failed to mark exhausted', e)
                    );
                    return false;
                }

                // Solo procesar pending o failed con intentos restantes
                return item.status === 'pending' || item.status === 'failed';
            })
            .sort((a, b) => a.priority - b.priority);

log.debug(`[SyncAdapter] Found ${pending.length} processable items (filtered ${queue.length - pending.length} exhausted/completed)`);
        return pending;
    },

    /**
     * Obtiene solo items urgentes (prioridad 0) para preemption.
     */
    async getUrgentItems(): Promise<SyncQueueItem[]> {
        const pending = await this.getPendingItems();
        const urgent = pending.filter(item => item.priority === 0);
        log.debug(`[SyncAdapter] Found ${urgent.length} urgent items`);
        return urgent;
    },

    /**
     * Metadatos de sincronización
     */
    async getMetadata(): Promise<SyncMetadata> {
        const key = OfflineStorageKeyManager.generateKey('system', 'sync_metadata', 'global');
        const meta = await offlineStorage.get<SyncMetadata>(key);
        return meta || { totalSyncs: 0, totalErrors: 0, workerStatus: 'idle' };
    },

    async updateMetadata(updates: Partial<SyncMetadata>): Promise<void> {
        const key = OfflineStorageKeyManager.generateKey('system', 'sync_metadata', 'global');
        const current = await this.getMetadata();
        await offlineStorage.set(key, { ...current, ...updates });
    },

    /**
     * Marca items como exhaustos si excedieron MAX_RETRIES.
     * Esto previene que items huérfanos se reprocesen infinitamente.
     */
    async markExhaustedItems(): Promise<number> {
        const queue = await this.getQueue();
        const maxRetries = SYNC_CONSTANTS.MAX_RETRIES;
        const toExhaust: string[] = [];

        for (const item of queue) {
            // Solo marcar pending/failed que excedieron reintentos
            if ((item.status === 'pending' || item.status === 'failed') && item.attempts >= maxRetries) {
                toExhaust.push(item.id);
            }
        }

        if (toExhaust.length > 0) {
            log.warn(`[SyncAdapter] Marking ${toExhaust.length} items as exhausted (max retries: ${maxRetries})`);
            for (const id of toExhaust) {
                await this.updateQueueItem(id, { status: 'exhausted' });
            }
        }

        return toExhaust.length;
    },

    /**
     * Limpia items de la cola de sincronización que están:
     * - Exhaustos (fallaron después de MAX_RETRIES)
     * - Completados/sincronizados antiguos (limpieza de已完成)
     * - Atascados (pending/failed por demasiado tiempo)
     * También marca items como exhaustos si excedieron MAX_RETRIES.
     */
    async cleanup(retentionDays: number = 7, stuckHours: number = 24): Promise<number> {
        // Primero marcar items que excedieron retries como exhaustos
        await this.markExhaustedItems();

        const queue = await this.getQueue();
        const now = Date.now();
        const stuckThreshold = now - (stuckHours * 60 * 60 * 1000);
        const completedThreshold = now - (retentionDays * 24 * 60 * 60 * 1000);

        const toDelete: string[] = [];

        for (const item of queue) {
            if (item.status === 'exhausted') {
                toDelete.push(item.id);
            } else if (item.status === 'completed') {
                if (item.createdAt < completedThreshold) {
                    toDelete.push(item.id);
                }
            } else if (item.status === 'pending' || item.status === 'failed') {
                if (item.createdAt < stuckThreshold) {
                    toDelete.push(item.id);
                }
            }
        }

        if (toDelete.length > 0) {
            log.info(`[SyncAdapter] Cleaning up ${toDelete.length} stuck/orphaned sync queue items`);
            await this.removeBatchFromQueue(toDelete);
        }

        return toDelete.length;
    }
};
