import { Result } from '@/shared/core';
import { BetType } from '@/types';
import { SyncStatus } from '@core/offline-storage/types';
import { BackendChildStructure, BackendListeroDetails } from '@/shared/services/structure/types';

import { FingerprintPayload } from '../crypto/fingerprint.repository';

// ============================================================================
// API CONTRACT TYPES (absorbed from services/bet/types.ts)
// ============================================================================

export interface GenericBetItemDTO {
    betTypeId: number | string;
    drawId: number | string;
    amount: number;
    numbers: string | number | number[] | Record<string, any>;
    external_id?: string;
    owner_structure?: number | string;
    fingerprint?: any; // Añadido para enviar al backend
}

export interface CreateBetDTO {
    drawId: string | number;
    bets: GenericBetItemDTO[];
    receiptCode?: string;
}

export interface BackendBet {
    id: number | string;
    draw: number | string;
    game_type?: number | string;
    bet_type?: number | string;
    numbers_played: any;
    amount: string | number;
    created_at: string;
    is_winner: boolean;
    payout_amount: string | number;
    owner_structure: number | string;
    receipt_code?: string;
    external_id?: string;
    draw_details?: { id: number | string; name: string; description?: string };
    game_type_details?: { id: number | string; name: string };
    bet_type_details?: { id: number | string; name: string; code?: string };
    fingerprint_data?: {
        hash?: string;
        version?: number;
        chainHash?: string;
        nonce?: string;
        timeAnchorSignature?: string;
        raw_payload?: string;
    };
}

export interface CreateBetResponse {
    bets: BackendBet[];
    structureTotalCollected: number;
    structureId: number;
}

export interface SyncPendingResult {
    success: number;
    failed: number;
    successBets: string[];
    failedBets: { receiptCode: string; error: string }[];
    structureTotalCollected?: number;
    structureId?: number;
}

export interface SortParam {
    field: 'createdAt' | 'amount' | 'id';
    order: 'asc' | 'desc';
}

export interface ListBetsFilters {
    drawId?: string;
    receiptCode?: string;
    date?: string;
    limit?: number;
    offset?: number;
    sort?: SortParam;
}

export type ChildStructure = BackendChildStructure;
export type ListeroDetails = BackendListeroDetails;

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

    /** Timestamp de cuando se completó la sincronización exitosamente */
    syncedAt?: number;
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

    /** Firma criptográfica inmutable para verificación offline */
    fingerprint?: FingerprintPayload;
}

export type BetPlacementInput = Omit<BetDomainModel, 'id' | 'externalId' | 'status' | 'timestamp' | 'createdAt'>;

export type BetRepositoryResult = BetType | BetType[];

/**
 * Totales crudos de apuestas para cálculos financieros externos.
 */
export interface RawBetTotals {
    totalCollected: number;
    commissions: number;
    netResult: number;
    betCount: number;
}

/**
 * Interface for the Bet Repository.
 * Defines the public API for all bet-related operations.
 */
export interface IBetRepository {
    placeBet(betData: BetPlacementInput): Promise<Result<Error, BetRepositoryResult>>;
    placeBatch(bets: BetPlacementInput[]): Promise<Result<Error, BetType[]>>;
    getBets(filters?: ListBetsFilters): Promise<Result<Error, BetType[]>>;
    getBetsOfflineFirst(filters?: ListBetsFilters): Promise<Result<Error, BetType[]>>;
    getPendingBets(): Promise<BetDomainModel[]>;
    addPendingBet(bet: BetDomainModel): Promise<void>;
    syncPending(): Promise<{ success: number; failed: number; successBets: string[]; failedBets: { receiptCode: string; error: string }[]; structureTotalCollected?: number; structureId?: number }>;
    applyMaintenance(): Promise<void>;
    cleanup(today: string): Promise<number>;
    recoverStuckBets(): Promise<number>;

    // Domain helper methods
    hasCriticalPendingBets(beforeTimestamp: number): Promise<boolean>;
    getAllRawBets(): Promise<BetDomainModel[]>;
    resetSyncStatus(offlineId: string): Promise<void>;
    isAppBlocked(): Promise<{ blocked: boolean; blockedBetsCount: number }>;
    onBetChanged(callback: () => void): () => void;
    isReady(): Promise<boolean>;

    // Agregaciones crudas (SSOT) - No incluyen lógica de negocio
    // commissionRate se obtiene internamente desde AuthRepository
    getFinancialSummary(todayStart: number, structureId?: string): Promise<RawBetTotals>;
    getTotalsByDrawId(todayStart: number, structureId?: string): Promise<Record<string, RawBetTotals>>;

    // Structure related methods
    getChildren(id: number, level?: number): Promise<ChildStructure[]>;
    getListeroDetails(id: number, date?: string): Promise<ListeroDetails>;

    // Delete bet by ID (for test cleanup)
    delete(betId: number): Promise<void>;
}

// ============================================================================
// PORTS (Hexagonal Architecture)
// ============================================================================

/**
 * Port for Bet Storage (Persistence)
 */
export interface IBetStorage {
    save(bet: BetDomainModel): Promise<void>;
    saveBatch(bets: BetDomainModel[]): Promise<void>;
    getAll(): Promise<BetDomainModel[]>;
    getFiltered(filters: {
        todayStart?: number;
        structureId?: string;
        drawId?: string | number;
        receiptCode?: string;
        date?: number | string;
    }): Promise<BetDomainModel[]>;
    getPending(): Promise<BetDomainModel[]>;
    getByStatus(status: BetDomainModel['status']): Promise<BetDomainModel[]>;
    getRecentByDraw(drawId: string | number, maxAgeMs?: number): Promise<BetDomainModel[]>;
    updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void>;
    delete(offlineId: string): Promise<void>;

    // Zero Trust Running Balance
    getTotalSales(drawId: string | number): Promise<number>;
    incrementTotalSales(drawId: string | number, amount: number): Promise<number>;
}

/**
 * Port for Bet API (Network)
 */
export interface ApiCallOptions {
  signal?: AbortSignal;
}

export interface IBetApi {
  create(bet: BetDomainModel, idempotencyKey: string, options?: ApiCallOptions): Promise<CreateBetResponse>;
  checkStatus(idempotencyKey: string, options?: ApiCallOptions): Promise<{ synced: boolean; bets?: BackendBet[] }>;
  list(filters?: ListBetsFilters, options?: ApiCallOptions): Promise<BackendBet[]>;
  delete(betId: number, options?: ApiCallOptions): Promise<void>;
  getChildren(id: number, level?: number): Promise<BackendChildStructure[]>;
  getListeroDetails(id: number, date?: string): Promise<BackendListeroDetails>;
  reportToDlq(bet: BetDomainModel, error: string): Promise<void>;
}
