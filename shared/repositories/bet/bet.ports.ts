import { BetDomainModel } from './bet.types';
import { CreateBetDTO, BackendBet, ListBetsFilters } from '@/shared/services/bet/types';
import { BackendChildStructure, BackendListeroDetails } from '@/shared/services/structure/types';

/**
 * Port for Bet Storage (Persistence)
 */
export interface IBetStorage {
    save(bet: BetDomainModel): Promise<void>;
    saveBatch(bets: BetDomainModel[]): Promise<void>;
    getAll(): Promise<BetDomainModel[]>;
    getFiltered(filters: { todayStart: number; structureId?: string }): Promise<BetDomainModel[]>;
    getPending(): Promise<BetDomainModel[]>;
    getByStatus(status: BetDomainModel['status']): Promise<BetDomainModel[]>;
    getRecentByDraw(drawId: string | number, maxAgeMs?: number): Promise<BetDomainModel[]>;
    updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void>;
    delete(offlineId: string): Promise<void>;
}

/**
 * Port for Bet API (Network)
 */
export interface IBetApi {
    create(bet: BetDomainModel, idempotencyKey: string): Promise<BackendBet | BackendBet[]>;
    checkStatus(idempotencyKey: string): Promise<{ synced: boolean; bets?: BackendBet[] }>;
    list(filters?: ListBetsFilters): Promise<BackendBet[]>;
    delete(betId: number): Promise<void>;

    // Structure related methods (moved from StructureService)
    getChildren(id: number, level?: number): Promise<BackendChildStructure[]>;
    getListeroDetails(id: number, date?: string): Promise<BackendListeroDetails>;
}
