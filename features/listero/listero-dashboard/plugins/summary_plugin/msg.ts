import { createMsg, WebData } from '@/shared/core/tea-utils';
import { FinancialSummary, PendingBet, DailyTotals, SummaryPluginContext } from './domain/models';

export const INIT_CONTEXT = createMsg<'INIT_CONTEXT', SummaryPluginContext>('INIT_CONTEXT');
export const GET_FINANCIAL_BETS = createMsg<'GET_FINANCIAL_BETS', void>('GET_FINANCIAL_BETS');
export const FINANCIAL_BETS_UPDATED = createMsg<'FINANCIAL_BETS_UPDATED', WebData<FinancialSummary>>('FINANCIAL_BETS_UPDATED');
export const GET_PENDING_BETS = createMsg<'GET_PENDING_BETS', void>('GET_PENDING_BETS');
export const PENDING_BETS_UPDATED = createMsg<'PENDING_BETS_UPDATED', WebData<PendingBet[]>>('PENDING_BETS_UPDATED');
export const TOGGLE_BALANCE_VISIBILITY = createMsg<'TOGGLE_BALANCE_VISIBILITY', void>('TOGGLE_BALANCE_VISIBILITY');
export const LOAD_PREFERENCES = createMsg<'LOAD_PREFERENCES', void>('LOAD_PREFERENCES');
export const PREFERENCES_LOADED = createMsg<'PREFERENCES_LOADED', { userProfile: any; userPreferences: any }>('PREFERENCES_LOADED');
export const CALCULATE_DAILY_TOTALS = createMsg<'CALCULATE_DAILY_TOTALS', void>('CALCULATE_DAILY_TOTALS');
export const DAILY_TOTALS_CALCULATED = createMsg<'DAILY_TOTALS_CALCULATED', WebData<DailyTotals>>('DAILY_TOTALS_CALCULATED');
export const NOOP = createMsg<'NOOP', void>('NOOP');

export type Msg =
  | typeof INIT_CONTEXT._type
  | typeof GET_FINANCIAL_BETS._type
  | typeof FINANCIAL_BETS_UPDATED._type
  | typeof GET_PENDING_BETS._type
  | typeof PENDING_BETS_UPDATED._type
  | typeof TOGGLE_BALANCE_VISIBILITY._type
  | typeof LOAD_PREFERENCES._type
  | typeof PREFERENCES_LOADED._type
  | typeof CALCULATE_DAILY_TOTALS._type
  | typeof DAILY_TOTALS_CALCULATED._type
  | typeof NOOP._type;
