import { OfflineStorageKeyManager } from '@core/offline-storage/utils';
import { offlineStorage } from '@core/offline-storage/instance';
import { IDlqStorage } from '../dlq.ports';
import { DlqItem, DlqItemStatus, DlqError, DlqStats } from '../dlq.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DlqStorageAdapter');

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

export class DlqStorageAdapter implements IDlqStorage {
    private generateId(): string {
        return `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    private buildKey(id: string): string {
        return OfflineStorageKeyManager.generateKey('dlq', 'items', id, 'data');
    }

    private buildDomainKey(domain: string): string {
        return `@v2:dlq:${domain}:*`;
    }

    async add<T>(domain: string, entityId: string, payload: T, error: DlqError, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<string> {
        const id = this.generateId();
        const now = Date.now();

        const item: DlqItem<T> = {
            id,
            domain,
            entityId,
            payload,
            error,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
            ttlSeconds
        };

        log.info(`[DLQ-STORAGE] 1. Guardando item en DLQ: ${domain}/${entityId} (ID: ${id}, TTL: ${ttlSeconds}s)`);
        const key = this.buildKey(id);
        await offlineStorage.set(key, item, { ttl: ttlSeconds * 1000 });

        log.info(`[DLQ-STORAGE] 2. Item ${id} guardado exitosamente.`);

        return id;
    }

    async getById(id: string): Promise<DlqItem | null> {
        const key = this.buildKey(id);
        return await offlineStorage.get<DlqItem>(key);
    }

    async getByDomain(domain: string): Promise<DlqItem[]> {
        const pattern = this.buildDomainKey(domain);
        const result = await offlineStorage.query<DlqItem>(pattern).all();
        return result;
    }

    async getAll(): Promise<DlqItem[]> {
        const pattern = `@v2:dlq:items:*`;
        return await offlineStorage.query<DlqItem>(pattern).all();
    }

    async updateStatus(id: string, status: DlqItemStatus): Promise<void> {
        log.info(`[DLQ-STORAGE] 3. Actualizando estado de item DLQ ${id} a: ${status}`);
        const item = await this.getById(id);
        if (!item) {
            log.warn(`[DLQ-STORAGE] WARNING: Item DLQ ${id} no encontrado para actualizar estado.`);
            return;
        }

        const key = this.buildKey(id);
        const updatedItem: DlqItem = {
            ...item,
            status,
            updatedAt: Date.now()
        };

        await offlineStorage.set(key, updatedItem);
        log.info(`[DLQ-STORAGE] 4. Estado de item DLQ ${id} actualizado exitosamente.`);
    }

    async delete(id: string): Promise<void> {
        const key = this.buildKey(id);
        await offlineStorage.remove(key);
        log.info(`DLQ item deleted: ${id}`);
    }

    async cleanup(): Promise<number> {
        const allItems = await this.getAll();
        const now = Date.now();
        let deletedCount = 0;

        for (const item of allItems) {
            const expiresAt = item.createdAt + (item.ttlSeconds * 1000);
            if (now > expiresAt) {
                await this.delete(item.id);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            log.info(`DLQ cleanup removed ${deletedCount} expired items`);
        }

        return deletedCount;
    }

    async getStats(): Promise<DlqStats> {
        const allItems = await this.getAll();
        const now = Date.now();

        let expired = 0;
        for (const item of allItems) {
            const expiresAt = item.createdAt + (item.ttlSeconds * 1000);
            if (now > expiresAt) {
                expired++;
            }
        }

        return {
            total: allItems.length,
            pending: allItems.filter(i => i.status === 'pending').length,
            reconciled: allItems.filter(i => i.status === 'reconciled').length,
            discarded: allItems.filter(i => i.status === 'discarded').length,
            expired
        };
    }
}
