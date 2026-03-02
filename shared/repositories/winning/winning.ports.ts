import { BackendWinningRecord as WinningRecord } from './api/types/types';

export { WinningRecord };

export interface IWinningRepository {
    getWinningNumber(drawId: string): Promise<WinningRecord | null>;
}
