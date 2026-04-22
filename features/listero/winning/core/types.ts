import { RemoteData } from '@core/tea-utils';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';
import { WinningRecordEntry } from '@/shared/repositories/winning_records/winning_records.repository';

/**
 * Grupo de apuestas ganadoras agrupadas por fecha
 * 
 * REFACTOR: Este es el nuevo modelo para mostrar winning numbers.
 * Se obtienen de BetRepository.getMyWinnings() y se agrupan por fecha.
 */
export interface WinningDrawGroup {
  date: string;              // YYYY-MM-DD
  drawName: string;          // Nombre del sorteo
  winnings: WinningBet[];    // Apuestas ganadoras de ese día
  totalCount: number;        // Total de apuestas ganadoras
}

/**
 * Grupo de winning records (todos los del banco) agrupados por fecha
 */
export interface WinningRecordGroup {
  date: string;
  entries: WinningRecordEntry[];
  totalCount: number;
}

export type WinningStatus = RemoteData<string, WinningDrawGroup[]>;
export type WinningsStatus = RemoteData<string, WinningBet[]>;
export type AllWinnersStatus = RemoteData<string, WinningRecordGroup[]>;

export type ViewType = 'all' | 'mine';
export type DateFilter = 'today' | 'yesterday' | 'week' | 'all';

export interface WinningModel {
  draws: WinningStatus;
  userWinnings: WinningsStatus;
  allWinners: AllWinnersStatus;
  pendingRewardsCount: number;
  pendingRewardsError: boolean;
  selectedDate: string;
  dateFilterType: DateFilter;
  selectedView: ViewType;
  structureId: string | null;
  configuredBetTypes: string[];
  betTypeFilter: string;
  filteredData: WinningDrawGroup[] | WinningRecordGroup[];
}

export interface AllWinnersPayload {
  groups: WinningRecordGroup[];
  configuredBetTypes: string[];
}

export type WinningMsg =
  | { type: 'INIT_MODULE'; payload?: string }
  | { type: 'FETCH_ALL_WINNING_DATA' }
  | { type: 'FETCH_WINNING_DRAWS' }
  | { type: 'FETCH_WINNING_DRAWS_SUCCESS'; payload: WinningDrawGroup[] }
  | { type: 'FETCH_WINNING_DRAWS_FAILURE'; payload: string }
  | { type: 'FETCH_USER_WINNINGS' }
  | { type: 'FETCH_USER_WINNINGS_SUCCESS'; payload: WinningBet[] }
  | { type: 'FETCH_USER_WINNINGS_FAILURE'; payload: string }
   | { type: 'FETCH_ALL_WINNERS' }
   | { type: 'REFRESH_WINNERS' }
   | { type: 'FETCH_ALL_WINNERS_SUCCESS'; payload: WinningRecordGroup[] }
   | { type: 'FETCH_ALL_WINNERS_FAILURE'; payload: string }
  | { type: 'FETCH_PENDING_REWARDS_COUNT' }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS'; payload: number }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_FAILURE' }
  | { type: 'CHANGE_DATE_FILTER'; payload: { date: string; filterType: DateFilter } }
  | { type: 'CHANGE_VIEW'; payload: ViewType }
  | { type: 'CHANGE_BET_TYPE_FILTER'; payload: string }
  | { type: 'RESET' };

export const INIT_MODULE = (structureId?: string): WinningMsg => ({ type: 'INIT_MODULE', payload: structureId });
export const CHANGE_DATE_FILTER = (date: string, filterType: DateFilter): WinningMsg => ({ type: 'CHANGE_DATE_FILTER', payload: { date, filterType } });
export const CHANGE_VIEW = (view: ViewType): WinningMsg => ({ type: 'CHANGE_VIEW', payload: view });
export const CHANGE_BET_TYPE_FILTER = (betType: string): WinningMsg => ({ type: 'CHANGE_BET_TYPE_FILTER', payload: betType });
export const FETCH_PENDING_REWARDS_COUNT = (): WinningMsg => ({ type: 'FETCH_PENDING_REWARDS_COUNT' });
