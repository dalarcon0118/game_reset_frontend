import { OfflineStorageKeyManager } from '@core/offline-storage/utils';
import { offlineStorage } from '@core/offline-storage/instance';
import { ITelemetryStorageAdapter } from '../telemetry.ports';
import { TelemetryEvent } from '../telemetry.types';

export class TelemetryStorageAdapter implements ITelemetryStorageAdapter {
    private static readonly MAX_EVENTS = 100;
    private static readonly MAX_UNSYNCED_DAYS = 2; // Borrar no sync después de 2 días

    private buildKey(id: string): string {
        return OfflineStorageKeyManager.generateKey('system', 'telemetry', id, 'data');
    }

    async save(event: TelemetryEvent): Promise<void> {
        await this.enforceLimit();
        await offlineStorage.set(this.buildKey(event.id), event);
    }

    private async enforceLimit(): Promise<void> {
        const events = await this.getAll();
        if (events.length >= TelemetryStorageAdapter.MAX_EVENTS) {
            const now = Date.now();
            const unsyncedThreshold = now - (TelemetryStorageAdapter.MAX_UNSYNCED_DAYS * 24 * 60 * 60 * 1000);
            
            // Priorizar cleanup: synced > unsynced-old > unsynced-recent
            const sorted = events.sort((a, b) => {
                // Synced primero (ya enviados al backend)
                if (a.synced !== b.synced) return a.synced ? -1 : 1;
                // Luego por edad
                return a.timestamp - b.timestamp;
            });
            
            const toDeleteCount = (events.length - TelemetryStorageAdapter.MAX_EVENTS) + 1;
            const toDeleteIds = sorted.slice(0, toDeleteCount).map(e => e.id);
            
            console.warn(`[TELEMETRY_STORAGE] Storage limit reached (${events.length}). Deleting ${toDeleteCount} oldest events.`);
            await this.delete(toDeleteIds);
        }
    }

    async getAll(): Promise<TelemetryEvent[]> {
        const pattern = OfflineStorageKeyManager.getPattern('system', 'telemetry', '*', 'data');
        return offlineStorage.query<TelemetryEvent>(pattern).all();
    }

    async markSynced(ids: string[]): Promise<void> {
        for (const id of ids) {
            const key = this.buildKey(id);
            const event = await offlineStorage.get<TelemetryEvent>(key);
            if (!event) continue;
            await offlineStorage.set(key, { ...event, synced: true });
        }
    }

    async delete(ids: string[]): Promise<void> {
        const keys = ids.map((id) => this.buildKey(id));
        await offlineStorage.removeMulti(keys);
    }

    async purge(retentionDays: number): Promise<number> {
        const events = await this.getAll();
        const now = Date.now();
        const threshold = now - (retentionDays * 24 * 60 * 60 * 1000);
        const unsyncedThreshold = now - (TelemetryStorageAdapter.MAX_UNSYNCED_DAYS * 24 * 60 * 60 * 1000);

        const toDelete = events
            .filter(event => {
                // Limpiar synced + expirados
                if (event.synced && event.timestamp < threshold) return true;
                // Limpiar unsynced + muy antiguos (fallaron sync)
                if (!event.synced && event.timestamp < unsyncedThreshold) return true;
                return false;
            })
            .map(event => event.id);

        if (toDelete.length > 0) {
            await this.delete(toDelete);
        }

        return toDelete.length;
    }
}
