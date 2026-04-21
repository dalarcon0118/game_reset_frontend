import { WinningBet } from '../winnings.types';
import { offlineStorage } from '@core/offline-storage/instance';
import { OfflineStorageKeyManager } from '@core/offline-storage/utils';
import { logger } from '@/shared/utils/logger';
import { STORAGE_TTL } from '@core/offline-storage/types';

const log = logger.withTag('WINNINGS_OFFLINE_ADAPTER');

const WINNINGS_KEYS = {
    WINNINGS: 'winnings',
    LAST_UPDATED: 'lastUpdated',
};

function buildWinningsKey(structureId: string): string {
    return OfflineStorageKeyManager.generateKey(
        WINNINGS_KEYS.WINNINGS,
        structureId,
        'data'
    );
}

function buildLastUpdatedKey(structureId: string): string {
    return OfflineStorageKeyManager.generateKey(
        WINNINGS_KEYS.WINNINGS,
        structureId,
        WINNINGS_KEYS.LAST_UPDATED
    );
}

export interface OfflineWinnings {
    data: WinningBet[];
    structureId: string;
    lastUpdated: number;
}

export class WinningsOfflineAdapter {
    async save(winnings: WinningBet[], structureId: string): Promise<void> {
        log.info('save: storing winnings to offline', { count: winnings.length, structureId });

        const key = buildWinningsKey(structureId);
        const lastUpdatedKey = buildLastUpdatedKey(structureId);

        await offlineStorage.set(key, {
            data: winnings,
            structureId,
            lastUpdated: Date.now(),
        } as OfflineWinnings, { ttl: STORAGE_TTL.WINNINGS });
        
        await offlineStorage.set(lastUpdatedKey, Date.now(), { ttl: STORAGE_TTL.WINNINGS });
    }

    async get(structureId: string): Promise<WinningBet[] | null> {
        log.info('get: retrieving winnings from offline', { structureId });

        const key = buildWinningsKey(structureId);
        const stored = await offlineStorage.get<OfflineWinnings>(key);

        if (!stored?.data) {
            log.info('get: no offline data found', { structureId });
            return null;
        }

        log.info('get: offline data found', { count: stored.data.length, lastUpdated: stored.lastUpdated });
        return stored.data;
    }

    async getLastUpdated(structureId: string): Promise<number | null> {
        const key = buildLastUpdatedKey(structureId);
        return await offlineStorage.get<number>(key);
    }

    async hasValidData(structureId: string): Promise<boolean> {
        const data = await this.get(structureId);
        return data !== null && data.length > 0;
    }

    async invalidate(structureId: string): Promise<void> {
        log.info('invalidate: clearing offline winnings', { structureId });
        
        const key = buildWinningsKey(structureId);
        const lastUpdatedKey = buildLastUpdatedKey(structureId);

        await offlineStorage.remove(key);
        await offlineStorage.remove(lastUpdatedKey);
    }
}

export const winningsOfflineAdapter = new WinningsOfflineAdapter();