import { Result, err } from 'neverthrow';
import { IBetRepository, BetRepositoryResult, BetDomainModel, ChildStructure, ListeroDetails, BetPlacementInput } from './bet.types';
import { IBetStorage, IBetApi } from './bet.ports';
import { logger } from '@/shared/utils/logger';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { BetType } from '@/types';

// Flows
import { placeBetFlow, placeBatchFlow } from './flows/place-bet.flow';
import { getBetsFlow } from './flows/get-bets.flow';
import { syncPendingFlow } from './flows/sync-bets.flow';
import { getFinancialSummaryFlow, getTotalsByDrawIdFlow } from './flows/financial.flow';

// Instantiate and export singleton with default adapters
import { BetStorageAdapter } from './adapters/bet.storage.adapter';
import { BetApiAdapter } from './adapters/bet.api.adapter';

const log = logger.withTag('BetRepository');

/**
 * Agnostic Bet Repository following the Refactor Workflow.
 * Orchestrates Storage and API through specialized Flows.
 */
export class BetRepository implements IBetRepository {
    private readonly log = log;

    constructor(
        private readonly storage: IBetStorage,
        private readonly api: IBetApi
    ) { }

    /**
     * Optimistic Place Bet: Saves locally and tries to sync.
     */
    async placeBet(betData: BetPlacementInput): Promise<Result<BetRepositoryResult, Error>> {
        try {
            return await placeBetFlow(betData, this.storage, this.api);
        } catch (error) {
            this.log.error('Error in placeBet', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Optimistic Place Batch: Saves all locally and returns pending results.
     */
    async placeBatch(bets: BetPlacementInput[]): Promise<Result<BetType[], Error>> {
        try {
            const result = await placeBatchFlow(bets, this.storage, this.api);
            return result as Result<BetType[], Error>;
        } catch (error) {
            this.log.error('Error in placeBatch', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Get all bets (Offline + Online) with deduplication.
     */
    async getBets(filters?: ListBetsFilters): Promise<Result<BetType[], Error>> {
        return await getBetsFlow(this.storage, this.api, filters);
    }

    /**
     * Manual Sync: Triggers synchronization of all pending bets.
     */
    async syncPending(): Promise<{ success: number; failed: number }> {
        return await syncPendingFlow(this.storage, this.api);
    }

    /**
     * Get financial summary for a period and structure.
     */
    async getFinancialSummary(todayStart: number, structureId?: string): Promise<{
        totalCollected: number;
        totalPaid: number;
        premiumsPaid: number;
        netResult: number;
        betCount: number;
    }> {
        return await getFinancialSummaryFlow(this.storage, todayStart, structureId);
    }

    /**
     * Get totals grouped by Draw ID for a period and structure.
     */
    async getTotalsByDrawId(todayStart: number, structureId?: string): Promise<Record<string, {
        totalCollected: number;
        totalPaid: number;
        premiumsPaid: number;
        netResult: number;
        betCount: number;
    }>> {
        return await getTotalsByDrawIdFlow(this.storage, todayStart, structureId);
    }

    /**
     * Checks if there are critical pending or failed bets before a specific timestamp.
     */
    async hasCriticalPendingBets(beforeTimestamp: number): Promise<boolean> {
        try {
            const allBets = await this.storage.getAll();
            return allBets.some(bet =>
                (bet.status === 'pending' || bet.status === 'error' || bet.status === 'blocked') &&
                bet.timestamp < beforeTimestamp
            );
        } catch (error) {
            this.log.error('Error checking critical pending bets', error);
            return false;
        }
    }

    /**
     * Get all raw bets from local storage.
     */
    async getAllRawBets(): Promise<BetDomainModel[]> {
        return await this.storage.getAll();
    }

    /**
     * Obtiene solo las apuestas pendientes (offline)
     */
    async getPendingBets(): Promise<BetDomainModel[]> {
        return await this.storage.getPending();
    }

    /**
     * Checks if the application should be blocked due to old unsynced bets.
     */
    async isAppBlocked(): Promise<{ blocked: boolean; blockedBetsCount: number }> {
        try {
            const blockedBets = await this.storage.getByStatus('blocked');
            return {
                blocked: blockedBets.length > 0,
                blockedBetsCount: blockedBets.length
            };
        } catch (error) {
            this.log.error('Error checking if app is blocked', error);
            return { blocked: false, blockedBetsCount: 0 };
        }
    }

    /**
     * Cleans up old failed bets.
     */
    async cleanupFailedBets(days: number = 7): Promise<number> {
        try {
            const allBets = await this.storage.getAll();
            const now = Date.now();
            const threshold = days * 24 * 60 * 60 * 1000;
            const toDelete = allBets.filter(b =>
                (b.status === 'error' || b.status === 'blocked') &&
                (now - b.timestamp) > threshold
            );

            for (const bet of toDelete) {
                await this.storage.delete(bet.externalId);
            }

            return toDelete.length;
        } catch (error) {
            this.log.error('Error cleaning up failed bets', error);
            return 0;
        }
    }

    /**
     * Recovers stuck bets with recoverable errors.
     */
    async recoverStuckBets(): Promise<number> {
        try {
            const pending = await this.storage.getPending();
            const recoverableErrors = [
                'No ID received',
                'Network request failed',
                'timeout',
                '500', '502', '503', '504', '408'
            ];

            const stuck = pending.filter(bet => {
                if (bet.status !== 'error') return false;
                const error = (bet as any).lastError || '';
                return recoverableErrors.some(err => error.includes(err));
            });

            this.log.info(`Found ${stuck.length} stuck bets to recover`);

            for (const bet of stuck) {
                await this.storage.updateStatus(bet.externalId, 'pending');
            }

            return stuck.length;
        } catch (error) {
            this.log.error('Error recovering stuck bets', error);
            return 0;
        }
    }

    async applyMaintenance(): Promise<void> {
        this.log.info('Applying maintenance to BetRepository');
        await this.cleanupFailedBets();
        await this.recoverStuckBets();
    }

    async getChildren(id: number, level: number = 1): Promise<ChildStructure[]> {
        return this.api.getChildren(id, level);
    }

    async getListeroDetails(id: number, date?: string): Promise<ListeroDetails> {
        return this.api.getListeroDetails(id, date);
    }
}

// Export singleton
export const betRepository = new BetRepository(
    new BetStorageAdapter(),
    new BetApiAdapter()
);
