import { BetTypeWithRewardsResponse, DrawTypeWithBetTypes, BetTypeInfo } from '@/shared/services/draw/types';

export interface RewardState {
  status: 'NotAsked' | 'Loading' | 'Success' | 'Failure';
  data: BetTypeWithRewardsResponse | null;
  error: string | null;
}

export interface RewardDrawType extends DrawTypeWithBetTypes {}
export interface RewardBetType extends BetTypeInfo {}
