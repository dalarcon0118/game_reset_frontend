import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { BackendBet, CreateBetDTO, ListBetsFilters } from './types';
import { BackendBetArrayCodec, BackendBetOrArrayCodec, decodeOrFallback } from './codecs';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BET_API');

export const BetApi = {
    create: async (data: CreateBetDTO): Promise<BackendBet | BackendBet[]> => {
        log.info('SENDING BET TO BACKEND (create)', {
            drawId: data.drawId,
            fijosCount: data.fijosCorridos?.length,
            parletsCount: data.parlets?.length,
            centenasCount: data.centenas?.length,
            rawPayload: JSON.stringify(data)
        });
        const response = await apiClient.post<BackendBet | BackendBet[]>(settings.api.endpoints.bets(), data);
        return decodeOrFallback(BackendBetOrArrayCodec, response, 'create') as BackendBet | BackendBet[];
    },

    /**
     * Create bet with idempotency key for offline sync support
     * @param data - Bet creation data
     * @param idempotencyKey - Unique key to prevent duplicate bets on retry
     */
    createWithIdempotencyKey: async (
        data: CreateBetDTO,
        idempotencyKey: string
    ): Promise<BackendBet | BackendBet[]> => {
        log.info('SENDING BET TO BACKEND (createWithIdempotencyKey)', {
            idempotencyKey,
            drawId: data.drawId,
            fijosCount: data.fijosCorridos?.length,
            parletsCount: data.parlets?.length,
            centenasCount: data.centenas?.length,
            rawPayload: JSON.stringify(data)
        });
        const response = await apiClient.post<BackendBet | BackendBet[]>(
            settings.api.endpoints.bets(),
            data,
            {
                headers: {
                    'X-Idempotency-Key': idempotencyKey
                }
            }
        );
        return decodeOrFallback(BackendBetOrArrayCodec, response, 'createWithIdempotencyKey') as BackendBet | BackendBet[];
    },

    /**
     * Check sync status for an offline bet
     * @param localId - The local idempotency key / offline ID
     */
    getSyncStatus: async (localId: string): Promise<{
        synced: boolean;
        receipt_code?: string;
        bets?: BackendBet[];
        synced_at?: string;
        message?: string;
    }> => {
        const endpoint = `${settings.api.endpoints.bets()}sync_status/${localId}/`;
        return apiClient.get(endpoint);
    },
    list: async (filters?: ListBetsFilters): Promise<BackendBet[]> => {
        log.debug('Start with filters', { filters });

        let endpoint = settings.api.endpoints.bets();
        const params = new URLSearchParams();

        if (filters?.drawId) {
            params.append('draw', filters.drawId);
        }

        if (filters?.receiptCode) {
            params.append('receipt_code', filters.receiptCode);
        }

        if (filters?.limit) {
            params.append('limit', filters.limit.toString());
        }
        if (filters?.offset) {
            params.append('offset', filters.offset.toString());
        }

        const queryString = params.toString();
        const finalEndpoint = `${endpoint}${queryString ? `?${queryString}` : ''}`;
        log.debug('Fetching from endpoint', { finalEndpoint });

        try {
            const response = await apiClient.get<BackendBet[]>(finalEndpoint);
            log.debug('Response received', {
                type: Array.isArray(response) ? `Array(${response.length})` : typeof response
            });
            return decodeOrFallback(BackendBetArrayCodec, response, 'list') as BackendBet[];
        } catch (error) {
            log.error('Error during fetch', error);
            throw error;
        }
    },
    listByDrawId: async (drawId: string): Promise<BackendBet[]> => {
        const endpoint = `${settings.api.endpoints.bets()}?draw=${drawId}`;
        const response = await apiClient.get<BackendBet[]>(endpoint);
        log.debug('Raw response received for listByDrawId');
        return decodeOrFallback(BackendBetArrayCodec, response, 'listByDrawId') as BackendBet[];
    }
};
