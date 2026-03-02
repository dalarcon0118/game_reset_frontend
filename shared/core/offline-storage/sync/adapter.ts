import { offlineStorage } from '../instance';
import { OfflineStorageKeyManager } from '../utils';
import { SyncQueueItem, SyncMetadata } from '../types';

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
     * Obtiene items pendientes ordenados por prioridad
     */
    async getPendingItems(): Promise<SyncQueueItem[]> {
        const queue = await this.getQueue();
        return queue
            .filter(item => item.status === 'pending' || item.status === 'failed')
            .sort((a, b) => a.priority - b.priority);
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
