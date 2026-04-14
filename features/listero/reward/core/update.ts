import { RewardState } from './types';

export type RewardUpdate =
  | { type: 'FETCH_STARTED' }
  | { type: 'FETCH_SUCCESS'; payload: RewardState['data'] }
  | { type: 'FETCH_FAILURE'; payload: string }
  | { type: 'RESET' };

export const RewardUpdate = {
  fetchStarted: (): RewardUpdate => ({ type: 'FETCH_STARTED' }),
  fetchSuccess: (data: RewardState['data']): RewardUpdate => ({ type: 'FETCH_SUCCESS', payload: data }),
  fetchFailure: (error: string): RewardUpdate => ({ type: 'FETCH_FAILURE', payload: error }),
  reset: (): RewardUpdate => ({ type: 'RESET' }),
};

export const rewardReducer = (state: RewardState, update: RewardUpdate): RewardState => {
  switch (update.type) {
    case 'FETCH_STARTED':
      return { ...state, status: 'Loading', error: null };
    case 'FETCH_SUCCESS':
      return { ...state, status: 'Success', data: update.payload, error: null };
    case 'FETCH_FAILURE':
      return { ...state, status: 'Failure', error: update.payload };
    case 'RESET':
      return { status: 'NotAsked', data: null, error: null };
    default:
      return state;
  }
};
