import apiClient from './api_client';
import settings from '@/config/settings';
import { WinningRecord } from '@/types';



export class WinningService {
    /**
     * Get winning number for a specific draw
     * @param drawId - ID of the draw
     * @returns Promise with WinningRecord or null
     */
    static async getWinningNumber(drawId: string): Promise<WinningRecord | null> {
        try {
            return await apiClient.get<WinningRecord>(
                `${settings.api.endpoints.draws()}${drawId}/get-winning-numbers/`,
                { silentErrors: true } // Don't log expected 404s
            );
        } catch (error) {
            // Only log if it's NOT a 404, as 404 is a valid business state
            if ((error as any)?.status !== 404) {
                console.error(`[WinningService] Unexpected error for drawId: ${drawId}`, error);
            }
            throw error;
        }
    }
}
