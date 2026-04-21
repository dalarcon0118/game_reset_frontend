import { RemoteData } from '@core/tea-utils';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

export interface WinningDrawGroup {
  date: string;
  drawName: string;
  winnings: WinningBet[];
  totalCount: number;
}

export type WinningsStatus = RemoteData<string, WinningBet[]>;
export type WinningStatus = RemoteData<string, WinningDrawGroup[]>;

export type DateFilter = 'today' | 'yesterday' | 'week' | 'all';

export interface MisGanadoresModel {
  draws: WinningStatus;
  userWinnings: WinningsStatus;
  selectedDate: string;
  dateFilterType: DateFilter;
  structureId: string | null;
  configuredBetTypes: string[];
  betTypeFilter: string;
  filteredData: WinningDrawGroup[];
}

export type MisGanadoresMsg =
  | { type: 'INIT'; payload?: string }
  | { type: 'FETCH_WINNING_DRAWS' }
  | { type: 'FETCH_WINNING_DRAWS_SUCCESS'; payload: WinningDrawGroup[] }
  | { type: 'FETCH_WINNING_DRAWS_FAILURE'; payload: string }
  | { type: 'FETCH_USER_WINNINGS' }
  | { type: 'FETCH_USER_WINNINGS_SUCCESS'; payload: WinningBet[] }
  | { type: 'FETCH_USER_WINNINGS_FAILURE'; payload: string }
  | { type: 'FETCH_PENDING_REWARDS_COUNT' }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS'; payload: number }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_FAILURE'; payload: number }
  | { type: 'CHANGE_DATE_FILTER'; payload: { date: string; filterType: DateFilter } }
  | { type: 'CHANGE_BET_TYPE_FILTER'; payload: string }
  | { type: 'REFRESH' }
  | { type: 'RESET' };

export { WinningBet } from '@/shared/repositories/bet/winnings.types';
