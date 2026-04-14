import { WinningState } from './types';

export type WinningUpdate =
  | { type: 'FETCH_STARTED' }
  | { type: 'FETCH_SUCCESS'; payload: WinningState['draws'] }
  | { type: 'FETCH_FAILURE'; payload: string }
  | { type: 'RESET' };

export const WinningUpdate = {
  fetchStarted: (): WinningUpdate => ({ type: 'FETCH_STARTED' }),
  fetchSuccess: (draws: WinningState['draws']): WinningUpdate => ({ type: 'FETCH_SUCCESS', payload: draws }),
  fetchFailure: (error: string): WinningUpdate => ({ type: 'FETCH_FAILURE', payload: error }),
  reset: (): WinningUpdate => ({ type: 'RESET' }),
};

export const winningReducer = (state: WinningState, update: WinningUpdate): WinningState => {
  switch (update.type) {
    case 'FETCH_STARTED':
      return { ...state, status: 'Loading', error: null };
    case 'FETCH_SUCCESS':
      return { ...state, status: 'Success', draws: update.payload, error: null };
    case 'FETCH_FAILURE':
      return { ...state, status: 'Failure', error: update.payload };
    case 'RESET':
      return { status: 'NotAsked', draws: [], error: null };
    default:
      return state;
  }
};
