import { WebData } from '@/shared/core/remote.data';
import { FinancialSummary, DrawType } from '@/types';
import { StatusFilter } from './core.types';

export type Msg =
    | { type: 'FETCH_DATA_REQUESTED'; structureId?: string }
    | { type: 'DRAWS_RECEIVED'; webData: WebData<DrawType[]> }
    | { type: 'SUMMARY_RECEIVED'; webData: WebData<FinancialSummary> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'SET_USER_STRUCTURE'; id: string }
    | { type: 'STATUS_FILTER_CHANGED'; filter: StatusFilter }
    | { type: 'APPLY_STATUS_FILTER'; filter: StatusFilter }
    | { type: 'RULES_CLICKED'; drawId: string }
    | { type: 'REWARDS_CLICKED'; drawId: string; title: string }
    | { type: 'BETS_LIST_CLICKED'; drawId: string; title: string }
    | { type: 'CREATE_BET_CLICKED'; drawId: string; title: string }
    | { type: 'NAVIGATE_TO_ERROR' }
    | { type: 'SET_COMMISSION_RATE'; rate: number }
    | { type: 'AUTH_USER_SYNCED'; user: any }
    | { type: 'TICK' };

export const FETCH_DATA_REQUESTED = (structureId?: string): Msg => ({ type: 'FETCH_DATA_REQUESTED', structureId });
export const REFRESH_CLICKED = (): Msg => ({ type: 'REFRESH_CLICKED' });
export const SET_USER_STRUCTURE = (id: string): Msg => ({ type: 'SET_USER_STRUCTURE', id });
export const STATUS_FILTER_CHANGED = (filter: StatusFilter): Msg => ({ type: 'STATUS_FILTER_CHANGED', filter });
export const APPLY_STATUS_FILTER = (filter: StatusFilter): Msg => ({ type: 'APPLY_STATUS_FILTER', filter });
export const RULES_CLICKED = (drawId: string): Msg => ({ type: 'RULES_CLICKED', drawId });
export const REWARDS_CLICKED = (drawId: string, title: string): Msg => ({ type: 'REWARDS_CLICKED', drawId, title });
export const BETS_LIST_CLICKED = (drawId: string, title: string): Msg => ({ type: 'BETS_LIST_CLICKED', drawId, title });
export const CREATE_BET_CLICKED = (drawId: string, title: string): Msg => ({ type: 'CREATE_BET_CLICKED', drawId, title });
export const TICK = (): Msg => ({ type: 'TICK' });
export const SET_COMMISSION_RATE = (rate: number): Msg => ({ type: 'SET_COMMISSION_RATE', rate });
export const AUTH_USER_SYNCED = (user: any): Msg => ({ type: 'AUTH_USER_SYNCED', user });
