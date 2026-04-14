import { WinningState } from './types';

export type WinningModel = WinningState;

export const initialWinningState: WinningState = {
  status: 'NotAsked',
  draws: [],
  error: null,
};
