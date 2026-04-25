import { WebData } from '@core/tea-utils';
import { FinancialSummary, DrawType, BetType } from '@/types';
import { StatusFilter } from './core.types';
import { DashboardUser } from './user.dto';

import { Msg as PromotionMsg } from '../../../../shared/components/promotion/msg';

export interface FinancialUpdate {
    type: string;
    timestamp: string;
    structure_id?: string;
    data: {
        bet_id?: string;
        draw_id?: string;
        date?: string;
        amount?: string;
        [key: string]: any;
    };
}

export type DrawTotalsUpdate = {
    drawId: string;
    totalCollected: number;
    premiumsPaid: number;
    netResult: number;
    betCount: number;
};

export type Msg =
    | { type: 'FETCH_DATA_REQUESTED'; structureId?: string }
    | { type: 'DRAWS_RECEIVED'; webData: WebData<DrawType[]> }
    | { type: 'PENDING_BETS_LOADED'; bets: BetType[]; syncedBets?: BetType[] }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'RETRY_INITIAL_LOAD' }
    | { type: 'SET_USER_STRUCTURE'; id: string }
    | { type: 'STATUS_FILTER_CHANGED'; filter: StatusFilter }
    | { type: 'APPLY_STATUS_FILTER'; filter: StatusFilter }
    | { type: 'SELECT_FILTER'; filter: StatusFilter }
    | { type: 'RULES_CLICKED'; drawId: string }
    | { type: 'REWARDS_CLICKED'; drawId: string; title: string }
    | { type: 'BETS_LIST_CLICKED'; drawId: string; title: string; drawType?: string }
    | { type: 'CREATE_BET_CLICKED'; drawId: string; title: string; drawType?: string }
    | { type: 'NAVIGATE_TO_ERROR' }
    | { type: 'SET_COMMISSION_RATE'; rate: number }
    | { type: 'AUTH_USER_SYNCED'; user: DashboardUser | null }
    | { type: 'AUTH_TOKEN_UPDATED'; token: string }
    | { type: 'NEEDS_PASSWORD_CHANGE'; needsChange: boolean }
    | { type: 'HELP_CLICKED' }
    | { type: 'TICK' }
    | { type: 'FINANCIAL_UPDATE_RECEIVED'; update: FinancialUpdate }
    | { type: 'SSE_CONNECTED' }
    | { type: 'SSE_ERROR'; error: string }
    | { type: 'NOTIFICATIONS_CLICKED' }
    | { type: 'SETTINGS_CLICKED' }
    | { type: 'TOGGLE_BALANCE' }
    | { type: 'TOGGLE_BALANCE_VISIBILITY' }
    | { type: 'SYSTEM_READY'; date: string; structureId?: string; user?: any }
    | { type: 'PROMOTION_MSG'; msg: PromotionMsg }
    | { type: 'ERROR'; error: any }
    | { type: 'NONE' }
    // SSOT: Financial summary (from summary_plugin)
    | { type: 'GET_FINANCIAL_BETS' }
    | { type: 'FINANCIAL_BETS_UPDATED'; webData: WebData<FinancialSummary> }
    // SSOT: Request local draws (from draws_list_plugin)
    | { type: 'REQUEST_LOCAL_DRAWS' }
    | { type: 'LOCAL_DRAWS_LOADED'; draws: DrawType[]; filteredDraws: DrawType[] }
    // SSOT: Totals by drawId (from draws_list_plugin)
    | { type: 'BATCH_OFFLINE_UPDATE'; updates: DrawTotalsUpdate[]; timestamp: number }
    // SSOT: External bet storage changed (from offlineEventBus)
    | { type: 'EXTERNAL_BETS_CHANGED' };

export const FETCH_DATA_REQUESTED = (structureId?: string): Msg => ({ type: 'FETCH_DATA_REQUESTED', structureId });
export const REFRESH_CLICKED = (): Msg => ({ type: 'REFRESH_CLICKED' });
export const RETRY_INITIAL_LOAD = (): Msg => ({ type: 'RETRY_INITIAL_LOAD' });
export const SET_USER_STRUCTURE = (id: string): Msg => ({ type: 'SET_USER_STRUCTURE', id });
export const STATUS_FILTER_CHANGED = (filter: StatusFilter): Msg => ({ type: 'STATUS_FILTER_CHANGED', filter });
export const APPLY_STATUS_FILTER = (filter: StatusFilter): Msg => ({ type: 'APPLY_STATUS_FILTER', filter });
export const SELECT_FILTER = (filter: StatusFilter): Msg => ({ type: 'SELECT_FILTER', filter });
export const RULES_CLICKED = (drawId: string): Msg => ({ type: 'RULES_CLICKED', drawId });
export const REWARDS_CLICKED = (drawId: string, title: string): Msg => ({ type: 'REWARDS_CLICKED', drawId, title });
export const BETS_LIST_CLICKED = (drawId: string, title: string, drawType?: string): Msg => ({ type: 'BETS_LIST_CLICKED', drawId, title, drawType });
export const CREATE_BET_CLICKED = (drawId: string, title: string, drawType?: string): Msg => ({ type: 'CREATE_BET_CLICKED', drawId, title, drawType });
export const NAVIGATE_TO_ERROR = (): Msg => ({ type: 'NAVIGATE_TO_ERROR' });
export const SET_COMMISSION_RATE = (rate: number): Msg => ({ type: 'SET_COMMISSION_RATE', rate });
export const AUTH_USER_SYNCED = (user: DashboardUser | null): Msg => ({ type: 'AUTH_USER_SYNCED', user });
export const AUTH_TOKEN_UPDATED = (token: string): Msg => ({ type: 'AUTH_TOKEN_UPDATED', token });
export const NEEDS_PASSWORD_CHANGE = (needsChange: boolean): Msg => ({ type: 'NEEDS_PASSWORD_CHANGE', needsChange });
export const HELP_CLICKED = (): Msg => ({ type: 'HELP_CLICKED' });
export const TICK = (): Msg => ({ type: 'TICK' });
export const NOTIFICATIONS_CLICKED = (): Msg => ({ type: 'NOTIFICATIONS_CLICKED' });
export const SETTINGS_CLICKED = (): Msg => ({ type: 'SETTINGS_CLICKED' });
export const TOGGLE_BALANCE = (): Msg => ({ type: 'TOGGLE_BALANCE' });
export const TOGGLE_BALANCE_VISIBILITY = (): Msg => ({ type: 'TOGGLE_BALANCE_VISIBILITY' });
export const NONE = (): Msg => ({ type: 'NONE' });
export const SYSTEM_READY = (payload: { date: string; structureId?: string; user?: any }): Msg => ({
    type: 'SYSTEM_READY',
    ...payload
});

export const PROMOTION_MSG = (msg: PromotionMsg): Msg => ({ type: 'PROMOTION_MSG', msg });

export const DRAWS_RECEIVED = (webData: WebData<DrawType[]>): Msg => ({ type: 'DRAWS_RECEIVED', webData });
export const PENDING_BETS_LOADED = (bets: BetType[], syncedBets?: BetType[]): Msg => ({ type: 'PENDING_BETS_LOADED', bets, syncedBets });
export const SSE_CONNECTED = (): Msg => ({ type: 'SSE_CONNECTED' });
export const SSE_ERROR = (error: string): Msg => ({ type: 'SSE_ERROR', error });
export const ERROR = (error: any): Msg => ({ type: 'ERROR', error });

// SSOT: Financial summary (from summary_plugin)
export const GET_FINANCIAL_BETS = (): Msg => ({ type: 'GET_FINANCIAL_BETS' });
export const FINANCIAL_BETS_UPDATED = (webData: WebData<FinancialSummary>): Msg => ({ type: 'FINANCIAL_BETS_UPDATED', webData });

// SSOT: Request local draws (from draws_list_plugin)
export const REQUEST_LOCAL_DRAWS = (): Msg => ({ type: 'REQUEST_LOCAL_DRAWS' });
export const LOCAL_DRAWS_LOADED = (draws: DrawType[], filteredDraws: DrawType[]): Msg => ({ type: 'LOCAL_DRAWS_LOADED', draws, filteredDraws });

// SSOT: Totals by drawId (from draws_list_plugin)
export const BATCH_OFFLINE_UPDATE = (updates: DrawTotalsUpdate[], timestamp: number): Msg => ({
    type: 'BATCH_OFFLINE_UPDATE',
    updates,
    timestamp
});

// SSOT: External bet storage changed (from offlineEventBus)
export const EXTERNAL_BETS_CHANGED = (): Msg => ({ type: 'EXTERNAL_BETS_CHANGED' });