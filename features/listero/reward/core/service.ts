import { logger } from '@/shared/utils/logger';
import { rewardRepository } from '@/shared/repositories/reward';
import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';

const log = logger.withTag('RewardService');

export const RewardService = {
  async getBetTypesWithRewards(): Promise<BetTypeWithRewardsResponse> {
    log.debug('[RewardService]getBetTypesWithRewards called');
    const result = await rewardRepository.getBetTypesWithRewards();
    
    if (result.ok) {
      log.debug('[RewardService]Returning data', {
        structureId: result.value?.structure_id,
        bankName: result.value?.bank_name,
        drawTypes: result.value?.draw_types?.map(dt => dt.name)
      });
      return result.value as BetTypeWithRewardsResponse;
    }
    
    log.warn('[RewardService]Throwing error', { error: result.error });
    throw new Error(result.error);
  },
};
