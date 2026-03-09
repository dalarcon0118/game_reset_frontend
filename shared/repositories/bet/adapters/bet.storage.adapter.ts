import { IBetStorage } from '../bet.ports';
import { BetDomainModel } from '../bet.types';
import { BetOfflineAdapter } from './bet.offline.adapter';
import { logger } from '@/shared/utils/logger';

/**
 * Adapter for Bet Storage using the new BetOfflineAdapter.
 */
export class BetStorageAdapter implements IBetStorage {
    private offlineAdapter = new BetOfflineAdapter();
    private log = logger.withTag('BetStorageAdapter');

    async save(bet: BetDomainModel): Promise<void> {
        this.log.info('Saving bet offline', { offlineId: bet.offlineId });
        await this.offlineAdapter.save(bet);
    }

    async getAll(): Promise<BetDomainModel[]> {
        return await this.offlineAdapter.getAll();
    }

    async getPending(): Promise<BetDomainModel[]> {
        return await this.offlineAdapter.getPending();
    }

    async getByStatus(status: BetDomainModel['status']): Promise<BetDomainModel[]> {
        return await this.offlineAdapter.getByStatus(status);
    }

    async getRecentByDraw(drawId: string | number, maxAgeMs?: number): Promise<BetDomainModel[]> {
        return await this.offlineAdapter.getRecentByDraw(drawId, maxAgeMs);
    }

    async updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void> {
        await this.offlineAdapter.updateStatus(offlineId, status, extra);
    }

    async delete(offlineId: string): Promise<void> {
        await this.offlineAdapter.delete(offlineId);
    }
}
