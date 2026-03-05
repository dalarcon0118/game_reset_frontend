import { Result } from 'neverthrow';
import { BetType } from '@/types';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { SyncStatus } from '@/shared/core/offline-storage/types';
import { BackendChildStructure, BackendListeroDetails } from '@/shared/services/structure/types';

export type ChildStructure = BackendChildStructure;
export type ListeroDetails = BackendListeroDetails;

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
 * Unified and flattened structure that aligns with the Backend contract.
 * 
 * IDENTITY FLOW:
 * 1. Creation: Frontend generates `externalId` (UUID) for offline storage and UI.
 * 2. Sync: `externalId` is sent to Backend as `external_id` for idempotency check.
 * 3. Persistence: Backend creates record with its own serial `id` (Backend PK).
 * 4. Completion: Frontend stores Backend PK in `backendId` for future reference.
 */
export interface BetDomainModel {
    /** 
     * UUID generated in the frontend. 
     * Used as the primary key for offline storage and as an idempotency key 
     * for backend requests to prevent duplicate bets on network retries.
     */
    externalId: string;

    /** Current sync status (pending, synced, error) */
    status: SyncStatus;

    /** When the bet was created locally */
    timestamp: number;

    /** Draw ID for this bet */
    drawId: string | number;

    /** ID of the bet type (FIJO, CORRIDO, etc) */
    betTypeId: string | number;

    /** Amount played */
    amount: number;

    /** Numbers played (string, array or object depending on type) */
    numbers: any;

    /** Optional pre-generated receipt code */
    receiptCode?: string;

    /** ID of the structure/banker owner of this bet */
    ownerStructure: string | number;

    // --- Optional / Results ---

    /** 
     * ID assigned by the backend after successful sync. 
     * This is the serial Primary Key from the database.
     */
    backendId?: string | number;

    /** Full result from backend after successful sync (for mapping) */
    backendBets?: BetType[];

    /** Optional commission rate applied */
    commissionRate?: number;

    /** Last error message if sync failed */
    lastError?: string;

    /** Number of sync attempts */
    retryCount?: number;
}

export type BetPlacementInput = Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>;

export type BetRepositoryResult = BetType | BetType[];

/**
 * Interface for the Bet Repository.
 * Defines the public API for all bet-related operations.
 */
export interface IBetRepository {
    placeBet(betData: BetPlacementInput): Promise<Result<BetRepositoryResult, Error>>;
    placeBatch(bets: BetPlacementInput[]): Promise<Result<BetType[], Error>>;
    getBets(filters?: ListBetsFilters): Promise<Result<BetType[], Error>>;
    getPendingBets(): Promise<BetDomainModel[]>;
    syncPending(): Promise<{ success: number; failed: number }>;
    applyMaintenance(): Promise<void>;

    // Domain helper methods
    hasCriticalPendingBets(beforeTimestamp: number): Promise<boolean>;
    getAllRawBets(): Promise<BetDomainModel[]>;

    // Financial calculations (on-demand from bets)
    getFinancialSummary(todayStart: number, structureId?: string): Promise<{
        totalCollected: number;
        totalPaid: number;
        premiumsPaid: number;
        netResult: number;
        betCount: number;
    }>;
    getTotalsByDrawId(todayStart: number, structureId?: string): Promise<Record<string, {
        totalCollected: number;
        totalPaid: number;
        premiumsPaid: number;
        netResult: number;
        betCount: number;
    }>>;

    // Structure related methods
    getChildren(id: number, level?: number): Promise<ChildStructure[]>;
    getListeroDetails(id: number, date?: string): Promise<ListeroDetails>;
}
