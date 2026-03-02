import { Result } from 'neverthrow';
import { BetType } from '@/types';
import { CreateBetDTO, ListBetsFilters } from '@/shared/services/bet/types';
import { SyncStatus } from '@/shared/core/offline-storage/types';
import { BackendChildStructure, BackendListeroDetails } from '@/shared/services/structure/types';

export type { BackendChildStructure as ChildStructure, BackendListeroDetails as ListeroDetails };

/**
 * Impacto financiero de una apuesta individual
 */
export interface FinancialImpact {
    /** Monto total recolectado (amount) */
    totalCollected: number;

    /** Comisión calculada para esta apuesta */
    commission: number;

    /** Monto neto después de comisión */
    netAmount: number;
}

/**
 * Domain model for a Bet in the repository context.
 * Combines data needed for both offline and online states.
 */
export interface BetDomainModel {
    offlineId: string;
    status: SyncStatus;
    data: CreateBetDTO & { commissionRate?: number };
    financialImpact?: FinancialImpact;
    timestamp: number;
    receiptCode?: string;
    backendBets?: BetType[]; // Result from backend after successful sync
    lastError?: string;
    retryCount?: number;
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
    getPendingBets(): Promise<BetDomainModel[]>;
    syncPending(): Promise<{ success: number; failed: number }>;
    applyMaintenance(): Promise<void>;

    // Structure related methods
    getChildren(id: number, level?: number): Promise<ChildStructure[]>;
    getListeroDetails(id: number, date?: string): Promise<ListeroDetails>;
}
