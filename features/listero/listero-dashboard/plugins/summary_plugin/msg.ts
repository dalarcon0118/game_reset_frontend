import { createMsg, WebData } from '@core/tea-utils';
import { FinancialSummary, SummaryPluginContext } from './domain/models';

export const INIT_CONTEXT = createMsg<'INIT_CONTEXT', SummaryPluginContext>('INIT_CONTEXT');
export const GET_FINANCIAL_BETS = createMsg<'GET_FINANCIAL_BETS', void>('GET_FINANCIAL_BETS');
export const FINANCIAL_BETS_UPDATED = createMsg<'FINANCIAL_BETS_UPDATED', WebData<FinancialSummary>>('FINANCIAL_BETS_UPDATED');
export const TOGGLE_BALANCE_VISIBILITY = createMsg<'TOGGLE_BALANCE_VISIBILITY', void>('TOGGLE_BALANCE_VISIBILITY');
export const LOAD_PREFERENCES = createMsg<'LOAD_PREFERENCES', void>('LOAD_PREFERENCES');
export const PREFERENCES_LOADED = createMsg<'PREFERENCES_LOADED', { userProfile: any; userPreferences: any }>('PREFERENCES_LOADED');
export const NOOP = createMsg<'NOOP', void>('NOOP');
export const DASHBOARD_DATA_SYNCED = createMsg<'DASHBOARD_DATA_SYNCED', { userStructureId?: string; todayStart?: number; trustedNow?: number; commissionRate?: number; backendPremiums?: number }>('DASHBOARD_DATA_SYNCED');

export type Msg =
  | typeof INIT_CONTEXT._type
  | typeof GET_FINANCIAL_BETS._type
  | typeof FINANCIAL_BETS_UPDATED._type
  | typeof TOGGLE_BALANCE_VISIBILITY._type
  | typeof LOAD_PREFERENCES._type
  | typeof PREFERENCES_LOADED._type
  | typeof NOOP._type
  | typeof DASHBOARD_DATA_SYNCED._type;
