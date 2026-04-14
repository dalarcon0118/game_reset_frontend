import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';

export const RewardAdapters = {
  normalizeBetTypeWithRewards: (data: BetTypeWithRewardsResponse) => ({
    ...data,
    draw_types: data.draw_types.map(dt => ({
      ...dt,
      bet_types: dt.bet_types.map(bt => ({
        ...bt,
        rewards: bt.rewards || [],
      })),
    })),
  }),
};
