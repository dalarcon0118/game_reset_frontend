import { IBetApi } from '../bet.ports';
import { CreateBetDTO, BackendBet, ListBetsFilters } from '@/shared/services/bet/types';
import { BetApi as LegacyBetApi } from '@/shared/services/bet/api';
import { StructureApi } from '@/shared/services/structure/api';
import { BackendChildStructure, BackendListeroDetails } from '@/shared/services/structure/types';

/**
 * Adapter for Bet API using the existing BetApi.
 * Now it properly passes the external_id to the backend.
 */
export class BetApiAdapter implements IBetApi {
    async create(data: CreateBetDTO, idempotencyKey: string): Promise<BackendBet | BackendBet[]> {
        // Inject external_id into each bet item for the backend to use as PK
        const dataWithExternalIds = {
            ...data,
            fijosCorridos: data.fijosCorridos?.map(item => ({ ...item, external_id: idempotencyKey })),
            centenas: data.centenas?.map(item => ({ ...item, external_id: idempotencyKey })),
            parlets: data.parlets?.map(item => ({ ...item, external_id: idempotencyKey })),
            loteria: data.loteria?.map(item => ({ ...item, external_id: idempotencyKey })),
            bets: data.bets?.map(item => ({ ...item, external_id: idempotencyKey }))
        };

        return LegacyBetApi.createWithIdempotencyKey(dataWithExternalIds as CreateBetDTO, idempotencyKey);
    }

    async checkStatus(idempotencyKey: string): Promise<{ synced: boolean; bets?: BackendBet[] }> {
        const status = await LegacyBetApi.getSyncStatus(idempotencyKey);
        return {
            synced: status.synced,
            bets: status.bets
        };
    }

    async list(filters?: ListBetsFilters): Promise<BackendBet[]> {
        const response = await LegacyBetApi.list(filters);
        return Array.isArray(response) ? response : [];
    }

    async getChildren(id: number, level: number = 1): Promise<BackendChildStructure[]> {
        return StructureApi.getChildren(id, level);
    }

    async getListeroDetails(id: number, date?: string): Promise<BackendListeroDetails> {
        return StructureApi.getListeroDetails(id, date);
    }
}
