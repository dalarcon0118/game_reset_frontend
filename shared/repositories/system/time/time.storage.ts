import { TimeMetadata } from './time.types';
import { offlineStorage } from '@/shared/core/offline-storage/storage';
import { SystemOfflineKeys } from '@/shared/repositories/financial/financial.offline.keys';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TIME_STORAGE');

// In-memory cache to avoid redundant I/O during high-frequency TEA message processing
let cachedMetadata: TimeMetadata | null = null;
let lastPersistAt: number = 0;
const PERSIST_THROTTLE_MS = 5000; // Only persist to disk every 5 seconds maximum

/**
 * Storage adapter for TimeMetadata using the global OfflineStorage instance.
 */
export const TimeStorage = {
    /**
     * Retrieves stored time metadata.
     */
    async getMetadata(): Promise<TimeMetadata | null> {
        // Return from memory cache if available
        if (cachedMetadata) return cachedMetadata;

        try {
            const key = SystemOfflineKeys.config('system', 'time_metadata');
            const data = await offlineStorage.get<TimeMetadata>(key);
            
            // Populate cache for future calls
            if (data) {
                cachedMetadata = data;
            }
            
            return data;
        } catch (error) {
            log.error('Error reading time metadata from storage', error);
            return null;
        }
    },

    /**
     * Persists time metadata.
     */
    async setMetadata(metadata: TimeMetadata): Promise<void> {
        // Update memory cache immediately
        cachedMetadata = metadata;

        const now = Date.now();
        // Only write to persistent storage if the throttle period has passed
        if (now - lastPersistAt < PERSIST_THROTTLE_MS) {
            return;
        }

        try {
            const key = SystemOfflineKeys.config('system', 'time_metadata');
            await offlineStorage.set(key, metadata);
            lastPersistAt = now;
        } catch (error) {
            log.error('Error saving time metadata to storage', error);
        }
    }
};
