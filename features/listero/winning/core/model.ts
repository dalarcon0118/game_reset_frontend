import { WinningModel } from './types';
import { RemoteData } from '@core/tea-utils';

export const initialWinningModel: WinningModel = {
  draws: RemoteData.notAsked(),
  userWinnings: RemoteData.notAsked(),
  allWinners: RemoteData.notAsked(),
  pendingRewardsCount: 0,
  pendingRewardsError: false,
  selectedDate: new Date().toISOString().split('T')[0],
  dateFilterType: 'all',
  selectedView: 'all',
  structureId: null,
  configuredBetTypes: [],
  betTypeFilter: 'all',
  filteredData: [],
};
