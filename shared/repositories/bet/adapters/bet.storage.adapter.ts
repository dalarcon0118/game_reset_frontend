import storageClient from '@/shared/services/storage_client';
import { IBetStorage } from '../bet.ports';
import { BetDomainModel } from '../bet.types';
import { OFFLINE_STORAGE_KEYS } from '@/shared/services/offline/types';

/**
 * Adapter for Bet Storage using the existing storageClient.
 */
export class BetStorageAdapter implements IBetStorage {
    private readonly STORAGE_KEY = OFFLINE_STORAGE_KEYS.PENDING_BETS_V2;

    async save(bet: BetDomainModel): Promise<void> {
        const bets = await this.getAll();
        const index = bets.findIndex(b => b.offlineId === bet.offlineId);
        if (index >= 0) {
            bets[index] = bet;
        } else {
            bets.push(bet);
        }
        await storageClient.set(this.STORAGE_KEY, bets);
    }

    async getAll(): Promise<BetDomainModel[]> {
        const data = await storageClient.get<BetDomainModel[]>(this.STORAGE_KEY);
        return data || [];
    }

    async getPending(): Promise<BetDomainModel[]> {
        const bets = await this.getAll();
        return bets.filter(b => b.status === 'PENDING' || b.status === 'FAILED');
    }

    async updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void> {
        const bets = await this.getAll();
        const index = bets.findIndex(b => b.offlineId === offlineId);
        if (index >= 0) {
            bets[index] = { ...bets[index], status, ...extra };
            await storageClient.set(this.STORAGE_KEY, bets);
        }
    }

    async delete(offlineId: string): Promise<void> {
        const bets = await this.getAll();
        const filtered = bets.filter(b => b.offlineId !== offlineId);
        await storageClient.set(this.STORAGE_KEY, filtered);
    }
}
