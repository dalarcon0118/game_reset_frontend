import { ExtendedDrawType } from '@/shared/services/draw/types';
import { RemoteData } from '@core/tea-utils';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

export type WinningStatus = RemoteData<string, ExtendedDrawType[]>;
export type WinningsStatus = RemoteData<string, WinningBet[]>;

export interface WinningModel {
  draws: WinningStatus;
  userWinnings: WinningsStatus;
  pendingRewardsCount: number;
}

export type WinningMsg =
  | { type: 'INIT_MODULE' }
  | { type: 'FETCH_ALL_WINNING_DATA' }
  | { type: 'FETCH_WINNING_DRAWS' }
  | { type: 'FETCH_WINNING_DRAWS_SUCCESS'; payload: ExtendedDrawType[] }
  | { type: 'FETCH_WINNING_DRAWS_FAILURE'; payload: string }
  | { type: 'FETCH_USER_WINNINGS' }
  | { type: 'FETCH_USER_WINNINGS_SUCCESS'; payload: WinningBet[] }
  | { type: 'FETCH_USER_WINNINGS_FAILURE'; payload: string }
  | { type: 'FETCH_PENDING_REWARDS_COUNT' }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS'; payload: number }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_FAILURE'; payload: number }
  | { type: 'RESET' };

export const INIT_MODULE = (): WinningMsg => ({ type: 'INIT_MODULE' });
