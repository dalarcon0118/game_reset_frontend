import { WinningApi } from './winning/api';
import { BackendWinningRecord } from './winning/types';

export type { BackendWinningRecord as WinningRecord };

export class WinningService {
    /**
     * Get winning number for a specific draw
     * @param drawId - ID of the draw
     * @returns Promise with WinningRecord or null
     */
    static async getWinningNumber(drawId: string): Promise<BackendWinningRecord | null> {
        return await WinningApi.getWinningNumber(drawId);
    }
}
