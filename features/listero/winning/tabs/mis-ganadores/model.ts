import { MisGanadoresModel } from './types';
import { RemoteData } from '@core/tea-utils';

export const initialMisGanadoresModel: MisGanadoresModel = {
  draws: RemoteData.notAsked(),
  userWinnings: RemoteData.notAsked(),
  pendingRewardsCount: 0,
  pendingRewardsError: false,
  selectedDate: new Date().toISOString().split('T')[0],
  dateFilterType: 'all',
  structureId: null,
  configuredBetTypes: [],
  betTypeFilter: 'all',
  filteredData: [],
};
