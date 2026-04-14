import { DrawApi } from '@/shared/services/draw/api';
import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RewardService');

export const RewardService = {
  async getBetTypesWithRewards(): Promise<BetTypeWithRewardsResponse> {
    log.debug('Fetching bet types with rewards');
    const result = await DrawApi.getBetTypesWithRewards();
    log.debug('Bet types with rewards fetched', { 
      drawTypesCount: result.draw_types.length,
      bankName: result.bank_name 
    });
    return result;
  },
};
