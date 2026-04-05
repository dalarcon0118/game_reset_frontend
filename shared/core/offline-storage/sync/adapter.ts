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
     * Obtiene todos los items de la cola
     */
    async getQueue(): Promise<SyncQueueItem[]> {
        const pattern = OfflineStorageKeyManager.getPattern('system', 'sync_queue', '*', 'data');
        return await offlineStorage.query<SyncQueueItem>(pattern).all();
    },

    /**
     * Agrega un item a la cola
     */
    async addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<string> {
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
                if (item.status === 'completed' || item.status === 'synced' || item.status === 'exhausted') {
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
    }
};
