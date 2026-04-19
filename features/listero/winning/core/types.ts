import { RemoteData } from '@core/tea-utils';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

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

export type WinningStatus = RemoteData<string, WinningDrawGroup[]>;
export type WinningsStatus = RemoteData<string, WinningBet[]>;

export interface WinningModel {
  draws: WinningStatus;
  userWinnings: WinningsStatus;
  pendingRewardsCount: number;
  selectedDate: string;      // Fecha seleccionada para filtro
}

export type WinningMsg =
  | { type: 'INIT_MODULE' }
  | { type: 'FETCH_ALL_WINNING_DATA' }
  | { type: 'FETCH_WINNING_DRAWS' }
  | { type: 'FETCH_WINNING_DRAWS_SUCCESS'; payload: WinningDrawGroup[] }
  | { type: 'FETCH_WINNING_DRAWS_FAILURE'; payload: string }
  | { type: 'FETCH_USER_WINNINGS' }
  | { type: 'FETCH_USER_WINNINGS_SUCCESS'; payload: WinningBet[] }
  | { type: 'FETCH_USER_WINNINGS_FAILURE'; payload: string }
  | { type: 'FETCH_PENDING_REWARDS_COUNT' }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_SUCCESS'; payload: number }
  | { type: 'FETCH_PENDING_REWARDS_COUNT_FAILURE'; payload: number }
  | { type: 'CHANGE_DATE_FILTER'; payload: string }
  | { type: 'RESET' };

export const INIT_MODULE = (): WinningMsg => ({ type: 'INIT_MODULE' });
export const CHANGE_DATE_FILTER = (date: string): WinningMsg => ({ type: 'CHANGE_DATE_FILTER', payload: date });
