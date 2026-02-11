import { createMsg } from '@/shared/core/msg';
import { FinancialSummary, PendingBet } from './domain/models';
import { SummaryPluginContext } from './domain/services';
import { DailyTotals } from './model';

import { WebData } from '@/shared/core/remote.data';

export const INIT_CONTEXT = createMsg<'INIT_CONTEXT', SummaryPluginContext>('INIT_CONTEXT');
export const FETCH_FINANCIAL_SUMMARY = createMsg<'FETCH_FINANCIAL_SUMMARY', void>('FETCH_FINANCIAL_SUMMARY');
export const FINANCIAL_SUMMARY_RECEIVED = createMsg<'FINANCIAL_SUMMARY_RECEIVED', WebData<FinancialSummary>>('FINANCIAL_SUMMARY_RECEIVED');
export const FETCH_PENDING_BETS = createMsg<'FETCH_PENDING_BETS', void>('FETCH_PENDING_BETS');
export const PENDING_BETS_RECEIVED = createMsg<'PENDING_BETS_RECEIVED', WebData<PendingBet[]>>('PENDING_BETS_RECEIVED');
export const TOGGLE_BALANCE_VISIBILITY = createMsg<'TOGGLE_BALANCE_VISIBILITY', void>('TOGGLE_BALANCE_VISIBILITY');
export const LOAD_PREFERENCES = createMsg<'LOAD_PREFERENCES', void>('LOAD_PREFERENCES');
export const PREFERENCES_LOADED = createMsg<'PREFERENCES_LOADED', { userProfile: any; userPreferences: any }>('PREFERENCES_LOADED');
export const CALCULATE_DAILY_TOTALS = createMsg<'CALCULATE_DAILY_TOTALS', void>('CALCULATE_DAILY_TOTALS');
export const DAILY_TOTALS_CALCULATED = createMsg<'DAILY_TOTALS_CALCULATED', WebData<DailyTotals>>('DAILY_TOTALS_CALCULATED');
export const NOOP = createMsg<'NOOP', void>('NOOP');

export type Msg =
  | typeof INIT_CONTEXT._type
  | typeof FETCH_FINANCIAL_SUMMARY._type
  | typeof FINANCIAL_SUMMARY_RECEIVED._type
  | typeof FETCH_PENDING_BETS._type
  | typeof PENDING_BETS_RECEIVED._type
  | typeof TOGGLE_BALANCE_VISIBILITY._type
  | typeof LOAD_PREFERENCES._type
  | typeof PREFERENCES_LOADED._type
  | typeof CALCULATE_DAILY_TOTALS._type
  | typeof DAILY_TOTALS_CALCULATED._type
  | typeof NOOP._type;
