import { IBetApi } from '../bet.ports';
import { BetDomainModel } from '../bet.types';
import { CreateBetDTO, BackendBet, ListBetsFilters } from '@/shared/services/bet/types';
import { BetApi as LegacyBetApi } from '@/shared/services/bet/api';
import { StructureApi } from '@/shared/services/structure/api';
import { BackendChildStructure, BackendListeroDetails } from '@/shared/services/structure/types';

/**
 * Adapter for Bet API using the existing BetApi.
 * Now it properly passes the external_id to the backend.
 */
export class BetApiAdapter implements IBetApi {
    async create(bet: BetDomainModel, idempotencyKey: string): Promise<BackendBet | BackendBet[]> {
        // ============================================================
        // FASE 2: Soporte para betTypeCode además de betTypeId
        // El backend ahora acepta código (FIJO, CORRIDO) además de ID
        // ============================================================
        const betTypeId = bet.betTypeCode || bet.betTypeId;

        // Transform the flat domain model into the flat DTO expected by the backend
        const dto: CreateBetDTO = {
            drawId: bet.drawId,
            bets: [{
                betTypeId: betTypeId,  // Ahora puede ser código (FIJO) o ID (1)
                drawId: bet.drawId,
                amount: bet.amount,
                numbers: bet.numbers,
                external_id: idempotencyKey,
                owner_structure: bet.ownerStructure
            }],
            receiptCode: bet.receiptCode
        };

        return LegacyBetApi.createWithIdempotencyKey(dto, idempotencyKey);
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

    async delete(betId: number): Promise<void> {
        await LegacyBetApi.delete(betId);
    }
}
