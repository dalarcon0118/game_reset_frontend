import { Result } from 'neverthrow';
import { BetType } from '@/types';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { SyncStatus } from '@core/offline-storage/types';
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
 * Contexto de sincronización para trazabilidad de errores y reintentos.
 * Implementa el patrón de "Observable State Machine" para evitar fallos silenciosos.
 */
export interface BetSyncContext {
    /** Timestamp del último intento de sincronización */
    lastAttempt: number;

    /** Cantidad de veces que se ha intentado sincronizar */
    attemptsCount: number;

    /** Mensaje de error legible del último fallo */
    lastError?: string;

    /** Clasificación del error para decidir la estrategia de reintento */
    errorType?: 'FATAL' | 'RETRYABLE';

    /** Timestamp programado para el próximo reintento (backoff) */
    nextRetryAt?: number;
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
export interface BetDomainModel extends BetType {
    // Los campos ya están en BetType, pero mantenemos BetDomainModel 
    // como el nombre del contrato dentro del repositorio para mayor semántica.
    // Añadimos campos específicos del repositorio si fuera necesario.
    backendBets?: BetType[];
    commissionRate?: number;

    /** Contexto de sincronización para observabilidad (Estilo DLQ) */
    syncContext?: BetSyncContext;
}

export type BetPlacementInput = Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp' | 'createdAt'>;

export type BetRepositoryResult = BetType | BetType[];

/**
 * Totales crudos de apuestas para cálculos financieros externos.
 */
export interface RawBetTotals {
    totalCollected: number;
    betCount: number;
}

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
    cleanup(today: string): Promise<number>;

    // Domain helper methods
    hasCriticalPendingBets(beforeTimestamp: number): Promise<boolean>;
    getAllRawBets(): Promise<BetDomainModel[]>;
    resetSyncStatus(offlineId: string): Promise<void>;

    // Agregaciones crudas (SSOT) - No incluyen lógica de negocio
    getFinancialSummary(todayStart: number, structureId?: string): Promise<RawBetTotals>;
    getTotalsByDrawId(todayStart: number, structureId?: string): Promise<Record<string, RawBetTotals>>;

    // Structure related methods
    getChildren(id: number, level?: number): Promise<ChildStructure[]>;
    getListeroDetails(id: number, date?: string): Promise<ListeroDetails>;
}
