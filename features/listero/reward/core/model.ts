import { RewardState } from './types';

export type RewardModel = RewardState;

export const initialRewardState: RewardState = {
  status: 'NotAsked',
  data: null,
  error: null,
};
