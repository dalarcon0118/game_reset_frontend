import { WinningModel } from './types';
import { RemoteData } from '@core/tea-utils';

export const initialWinningModel: WinningModel = {
  draws: RemoteData.notAsked(),
  userWinnings: RemoteData.notAsked(),
  pendingRewardsCount: 0,
  selectedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
};
