import { WinningState } from './types';

export const WinningSelectors = {
  selectStatus: (state: WinningState) => state.status,
  selectDraws: (state: WinningState) => state.draws,
  selectError: (state: WinningState) => state.error,
  selectIsLoading: (state: WinningState) => state.status === 'Loading',
  selectHasError: (state: WinningState) => state.status === 'Failure',
  selectHasData: (state: WinningState) => state.status === 'Success' && state.draws.length > 0,
};
