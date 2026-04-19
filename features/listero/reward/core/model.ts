import { RewardModel } from './types';
import { RemoteData } from '@core/tea-utils';

/**
 * 📊 REWARD MODEL
 * Estado inicial del módulo siguiendo arquitectura TEA.
 */
export const initialRewardModel: RewardModel = {
  betTypes: {
    status: RemoteData.notAsked()
  },
  structureId: null,
  pendingRewardsCount: 0
};
