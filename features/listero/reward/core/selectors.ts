import { RewardState } from './types';

export const RewardSelectors = {
  selectStatus: (state: RewardState) => state.status,
  selectData: (state: RewardState) => state.data,
  selectError: (state: RewardState) => state.error,
  selectDrawTypes: (state: RewardState) => state.data?.draw_types || [],
  selectBankName: (state: RewardState) => state.data?.bank_name || '',
  selectIsLoading: (state: RewardState) => state.status === 'Loading',
  selectHasError: (state: RewardState) => state.status === 'Failure',
  selectHasData: (state: RewardState) => state.status === 'Success' && state.data !== null,
};
