import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { BackendBet, CreateBetDTO, ListBetsFilters } from './types';
import { BackendBetArrayCodec, BackendBetOrArrayCodec, decodeOrFallback } from './codecs';

export const BetApi = {
    create: async (data: CreateBetDTO): Promise<BackendBet | BackendBet[]> => {
        const response = await apiClient.post<BackendBet | BackendBet[]>(settings.api.endpoints.bets(), data);
        return decodeOrFallback(BackendBetOrArrayCodec, response, 'create');
    },
    list: async (filters?: ListBetsFilters): Promise<BackendBet[]> => {
        console.log('[BetApi.list] Start with filters:', JSON.stringify(filters));

        let endpoint = settings.api.endpoints.bets();
        const params = new URLSearchParams();

        if (filters?.drawId) {
            params.append('draw', filters.drawId);
        }

        if (filters?.limit) {
            params.append('limit', filters.limit.toString());
        }
        if (filters?.offset) {
            params.append('offset', filters.offset.toString());
        }

        const queryString = params.toString();
        const finalEndpoint = `${endpoint}${queryString ? `?${queryString}` : ''}`;
        console.log('[BetApi.list] Fetching from endpoint:', finalEndpoint);

        try {
            const response = await apiClient.get<BackendBet[]>(finalEndpoint);
            console.log('[BetApi.list] Response received:', Array.isArray(response) ? `Array(${response.length})` : typeof response);
            return decodeOrFallback(BackendBetArrayCodec, response, 'list');
        } catch (error) {
            console.error('[BetApi.list] Error during fetch:', error);
            throw error;
        }
    },
    listByDrawId: async (drawId: string): Promise<BackendBet[]> => {
        const endpoint = `${settings.api.endpoints.bets()}?draw=${drawId}`;
        const response = await apiClient.get<BackendBet[]>(endpoint);
        console.log('[BetApi.listByDrawId] Raw response:');
        console.log(response)
        return decodeOrFallback(BackendBetArrayCodec, response, 'listByDrawId');
    }
};
