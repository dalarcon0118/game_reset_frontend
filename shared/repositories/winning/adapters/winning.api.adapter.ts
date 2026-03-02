import { IWinningRepository, WinningRecord } from '../winning.ports';
import { WinningApi } from '../api/api';

export class WinningApiAdapter implements IWinningRepository {
    async getWinningNumber(drawId: string): Promise<WinningRecord | null> {
        return WinningApi.getWinningNumber(drawId);
    }
}
