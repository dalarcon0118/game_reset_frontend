import { BetDomainModel } from './bet.types';
import { CreateBetDTO, BackendBet, ListBetsFilters } from '@/shared/services/bet/types';

/**
 * Port for Bet Storage (Persistence)
 */
export interface IBetStorage {
    save(bet: BetDomainModel): Promise<void>;
    getAll(): Promise<BetDomainModel[]>;
    getPending(): Promise<BetDomainModel[]>;
    updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void>;
    delete(offlineId: string): Promise<void>;
}

/**
 * Port for Bet API (Network)
 */
export interface IBetApi {
    create(data: CreateBetDTO, idempotencyKey: string): Promise<BackendBet | BackendBet[]>;
    checkStatus(idempotencyKey: string): Promise<{ synced: boolean; bets?: BackendBet[] }>;
    list(filters?: ListBetsFilters): Promise<BackendBet[]>;
}
