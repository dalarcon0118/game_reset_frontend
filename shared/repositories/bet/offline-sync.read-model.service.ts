import { BetDomainModel } from './bet.types';
import { WorkerStatus } from '@core/offline-storage/types';

export interface OfflineSyncBetView {
    offlineId: string;
    amount: number;
    timestamp: number;
    status: BetDomainModel['status'];
    lastError?: string;
    attempts?: number;
    errorType?: 'FATAL' | 'RETRYABLE';
    lastAttempt?: number;
}

export interface OfflineSyncStatsView {
    pendingCount: number;
    syncingCount: number;
    errorCount: number;
}

const toSafeNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const resolveOfflineId = (bet: any): string =>
    String(bet?.externalId ?? bet?.offlineId ?? '');

const resolveAmount = (bet: any): number => {
    if (!bet) return 0;
    const amount = (bet && typeof bet === 'object')
        ? (bet.amount !== undefined ? bet.amount : (bet.data ? bet.data.amount : 0))
        : 0;
    return toSafeNumber(amount);
};

const resolveTimestamp = (bet: any): number =>
    toSafeNumber(bet?.timestamp ?? Date.now());

const toView = (bet: any): OfflineSyncBetView => {
    const syncContext = bet?.syncContext;

    return {
        offlineId: resolveOfflineId(bet),
        amount: resolveAmount(bet),
        timestamp: resolveTimestamp(bet),
        status: (bet?.status ?? 'pending') as BetDomainModel['status'],
        lastError: syncContext?.lastError ?? bet?.lastError,
        attempts: syncContext?.attemptsCount,
        errorType: syncContext?.errorType,
        lastAttempt: syncContext?.lastAttempt
    };
};

export const OfflineSyncReadModelService = {
    mapBets(rawBets: BetDomainModel[]): OfflineSyncBetView[] {
        if (!Array.isArray(rawBets)) return [];
        return rawBets
            .filter(bet => !!bet)
            .map((bet) => toView(bet));
    },

    splitBets(rawBets: BetDomainModel[]): {
        pending: OfflineSyncBetView[];
        syncing: OfflineSyncBetView[];
        error: OfflineSyncBetView[];
    } {
        const normalized = this.mapBets(rawBets);
        return {
            // 'pending' incluye las que están listas para sync
            pending: normalized.filter((bet) => bet.status === 'pending'),
            // 'syncing' es un estado de la cola, pero si el modelo no lo tiene, devolvemos vacío o manejamos vía worker
            syncing: [],
            // 'error' incluye las fallidas (DLQ)
            error: normalized.filter((bet) => bet.status === 'error')
        };
    },

    buildStats(rawBets: BetDomainModel[]): OfflineSyncStatsView {
        const split = this.splitBets(rawBets);
        return {
            pendingCount: split.pending.length,
            syncingCount: split.syncing.length,
            errorCount: split.error.length
        };
    },

    normalizeWorkerStatus(status: WorkerStatus): 'idle' | 'running' | 'paused' | 'stopped' | 'error' {
        if (status === 'stopping') {
            return 'running';
        }
        return status;
    }
};
