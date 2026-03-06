import { TimeMetadata } from './time.types';
import { offlineStorage } from '@/shared/core/offline-storage/storage';
import { SystemOfflineKeys } from '@/shared/repositories/financial/financial.offline.keys';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TIME_STORAGE');

/**
 * Storage adapter for TimeMetadata using the global OfflineStorage instance.
 */
export const TimeStorage = {
    /**
     * Retrieves stored time metadata.
     */
    async getMetadata(): Promise<TimeMetadata | null> {
        try {
            const key = SystemOfflineKeys.config('system', 'time_metadata');
            return await offlineStorage.get<TimeMetadata>(key);
        } catch (error) {
            log.error('Error reading time metadata from storage', error);
            return null;
        }
    },

    /**
     * Persists time metadata.
     */
    async setMetadata(metadata: TimeMetadata): Promise<void> {
        try {
            const key = SystemOfflineKeys.config('system', 'time_metadata');
            await offlineStorage.set(key, metadata);
        } catch (error) {
            log.error('Error saving time metadata to storage', error);
        }
    }
};
