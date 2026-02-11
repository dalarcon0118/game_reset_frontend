import apiClient from '../api_client';
import settings from '@/config/settings';
import { BackendWinningRecord } from './types';
import { BackendWinningRecordCodec, decodeOrFallback } from './codecs';

export const WinningApi = {
    getWinningNumber: async (drawId: string): Promise<BackendWinningRecord | null> => {
        try {
            const response = await apiClient.get<BackendWinningRecord>(
                `${settings.api.endpoints.draws()}${drawId}/get-winning-numbers/`,
                { silentErrors: true }
            );
            if (!response) return null;
            return decodeOrFallback(BackendWinningRecordCodec, response, `getWinningNumber(${drawId})`);
        } catch (error) {
            if ((error as any)?.status !== 404) {
                console.error(`[WinningApi] Unexpected error for drawId: ${drawId}`, error);
            }
            throw error;
        }
    }
};
