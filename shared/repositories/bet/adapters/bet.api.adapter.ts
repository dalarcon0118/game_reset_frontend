import { IBetApi, BetDomainModel, CreateBetDTO, BackendBet, ListBetsFilters } from '../bet.types';
import { StructureApi } from '@/shared/services/structure/api';
import { BackendChildStructure, BackendListeroDetails } from '@/shared/services/structure/types';
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import * as t from 'io-ts';
import { isRight } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BetApiAdapter');

// ============================================================================
// CODECS (absorbed from services/bet/codecs.ts)
// ============================================================================

const StringOrNumber = t.union([t.string, t.number]);

const BackendBetCodec = t.intersection([
    t.type({
        id: StringOrNumber,
        draw: StringOrNumber,
        numbers_played: t.unknown,
        amount: StringOrNumber,
        created_at: t.string
    }),
    t.partial({
        is_winner: t.boolean,
        payout_amount: StringOrNumber,
        owner_structure: StringOrNumber,
        game_type: StringOrNumber,
        bet_type: StringOrNumber,
        receipt_code: t.string,
        external_id: t.string,
        draw_details: t.intersection([t.type({ id: StringOrNumber, name: t.string }), t.partial({ description: t.string })]),
        game_type_details: t.type({ id: StringOrNumber, name: t.string }),
        bet_type_details: t.intersection([t.type({ id: StringOrNumber, name: t.string }), t.partial({ code: t.string })])
    })
]);

const BackendBetArrayCodec = t.array(BackendBetCodec);
const BackendBetOrArrayCodec = t.union([BackendBetCodec, BackendBetArrayCodec]);

const decodeOrFallback = <T>(codec: t.Type<T>, value: unknown, label: string): T => {
    const result = codec.decode(value);
    if (isRight(result)) return result.right;
    log.warn(`${label} decode failed`, { errors: PathReporter.report(result).join('; ') });
    return value as T;
};

// ============================================================================
// ADAPTER
// ============================================================================

export class BetApiAdapter implements IBetApi {
    async create(bet: BetDomainModel, idempotencyKey: string): Promise<BackendBet | BackendBet[]> {
        log.info(`[BET-API] Sending bet: ${idempotencyKey}`);
        const betTypeId = bet.betTypeCode || bet.betTypeId;

        const dto: CreateBetDTO = {
            drawId: bet.drawId,
            bets: [{
                betTypeId,
                drawId: bet.drawId,
                amount: bet.amount,
                numbers: bet.numbers,
                external_id: idempotencyKey,
                owner_structure: bet.ownerStructure
            }],
            receiptCode: bet.receiptCode
        };

        const response = await apiClient.post<BackendBet | BackendBet[]>(
            settings.api.endpoints.bets(),
            dto,
            { headers: { 'X-Idempotency-Key': idempotencyKey } }
        );
        return decodeOrFallback(BackendBetOrArrayCodec, response, 'create') as BackendBet | BackendBet[];
    }

    async checkStatus(idempotencyKey: string): Promise<{ synced: boolean; bets?: BackendBet[] }> {
        const endpoint = `${settings.api.endpoints.bets()}sync_status/${idempotencyKey}/`;
        const status = await apiClient.get<{ synced: boolean; bets?: BackendBet[] }>(endpoint);
        return { synced: status.synced, bets: status.bets };
    }

    async list(filters?: ListBetsFilters): Promise<BackendBet[]> {
        log.debug('List bets with filters', { filters });
        let endpoint = settings.api.endpoints.bets();
        const params = new URLSearchParams();
        if (filters?.drawId) params.append('draw', filters.drawId);
        if (filters?.receiptCode) params.append('receipt_code', filters.receiptCode);
        if (filters?.date) params.append('date', filters.date); // El backend soporta ?date=YYYY-MM-DD
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const queryString = params.toString();
        const finalEndpoint = `${endpoint}${queryString ? `?${queryString}` : ''}`;

        try {
            const response = await apiClient.get<BackendBet[]>(finalEndpoint);
            return decodeOrFallback(BackendBetArrayCodec, response, 'list') as BackendBet[];
        } catch (error) {
            log.error('Error fetching bets', error);
            throw error;
        }
    }

    async delete(betId: number): Promise<void> {
        const endpoint = `${settings.api.endpoints.bets()}${betId}/`;
        await apiClient.delete(endpoint);
    }

    async getChildren(id: number, level: number = 1): Promise<BackendChildStructure[]> {
        return StructureApi.getChildren(id, level);
    }

    async getListeroDetails(id: number, date?: string): Promise<BackendListeroDetails> {
        return StructureApi.getListeroDetails(id, date);
    }

    async reportToDlq(bet: BetDomainModel, error: string): Promise<void> {
        const endpoint = `${settings.api.endpoints.bets()}dead-letter-queue/report/`;
        await apiClient.post(endpoint, {
            idempotency_key: bet.externalId,
            local_id: bet.externalId,
            draw_id: String(bet.drawId),
            amount: bet.amount,
            error,
            bet_data: bet
        });
    }
}
