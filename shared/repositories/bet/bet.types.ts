import { Result } from 'neverthrow';
import { BetType } from '@/types';
import { CreateBetDTO, ListBetsFilters } from '@/shared/services/bet/types';
import { SyncStatus } from '@/shared/services/offline/types';

/**
 * Domain model for a Bet in the repository context.
 * Combines data needed for both offline and online states.
 */
export interface BetDomainModel {
    offlineId: string;
    status: SyncStatus;
    data: CreateBetDTO & { commissionRate?: number };
    timestamp: number;
    receiptCode?: string;
    backendBets?: BetType[]; // Result from backend after successful sync
}

export type BetRepositoryResult = BetType | BetType[];

/**
 * Interface for the Bet Repository.
 * Defines the public API for all bet-related operations.
 */
export interface IBetRepository {
    placeBet(betData: BetDomainModel['data']): Promise<Result<BetRepositoryResult, Error>>;
    placeBatch(bets: BetDomainModel['data'][]): Promise<Result<BetType[], Error>>;
    getBets(filters?: ListBetsFilters): Promise<Result<BetType[], Error>>;
    syncPending(): Promise<{ success: number; failed: number }>;
    applyMaintenance(): Promise<void>;
}
