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
            const response = await apiClient.get<WinningRecord>(
                `${settings.api.endpoints.draws()}${drawId}/get-winning-numbers/`
            );

            console.info(`[Winning number for drawId: ${drawId}]`, JSON.stringify(response));
            return response;
        } catch (error) {
            console.error('Error fetching winning number:', error);
            return null;
        }
    }
}
