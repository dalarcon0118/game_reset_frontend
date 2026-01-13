import { FinancialSummary, DrawType } from '@/types';

export interface ErrorInfo {
    message: string;
    status?: number;
}

export type StatusFilter = 'all' | 'open' | 'closed' | 'closing_soon' | 'rewarded';

export interface Model {
    draws: {
        data: DrawType[] | null;
        filteredData: DrawType[];
        loading: boolean;
        error: ErrorInfo | null;
    };
    summary: {
        data: FinancialSummary | null;
        loading: boolean;
        error: ErrorInfo | null;
    };
    dailyTotals: {
        totalCollected: number;
        premiumsPaid: number;
        netResult: number;
        estimatedCommission: number;
        amountToRemit: number;
    };
    userStructureId: null | string;
    statusFilter: StatusFilter;
    appliedFilter: StatusFilter;
    commissionRate: number;
}

export enum MsgType {
    FETCH_DATA_REQUESTED = 'FETCH_DATA_REQUESTED',
    FETCH_DRAWS_SUCCEEDED = 'FETCH_DRAWS_SUCCEEDED',
    FETCH_DRAWS_FAILED = 'FETCH_DRAWS_FAILED',
    FETCH_SUMMARY_SUCCEEDED = 'FETCH_SUMMARY_SUCCEEDED',
    FETCH_SUMMARY_FAILED = 'FETCH_SUMMARY_FAILED',
    REFRESH_CLICKED = 'REFRESH_CLICKED',
    SET_USER_STRUCTURE = 'SET_USER_STRUCTURE',
    STATUS_FILTER_CHANGED = 'STATUS_FILTER_CHANGED',
    APPLY_STATUS_FILTER = 'APPLY_STATUS_FILTER',
    RULES_CLICKED = 'RULES_CLICKED',
    REWARDS_CLICKED = 'REWARDS_CLICKED',
    BETS_LIST_CLICKED = 'BETS_LIST_CLICKED',
    CREATE_BET_CLICKED = 'CREATE_BET_CLICKED',
    NAVIGATE_TO_ERROR = 'NAVIGATE_TO_ERROR',
    TICK = 'TICK',
}

export type Msg =
    | { type: MsgType.FETCH_DATA_REQUESTED }
    | { type: MsgType.FETCH_DRAWS_SUCCEEDED; draws: DrawType[] }
    | { type: MsgType.FETCH_DRAWS_FAILED; error: ErrorInfo }
    | { type: MsgType.FETCH_SUMMARY_SUCCEEDED; summary: FinancialSummary }
    | { type: MsgType.FETCH_SUMMARY_FAILED; error: ErrorInfo }
    | { type: MsgType.REFRESH_CLICKED }
    | { type: MsgType.SET_USER_STRUCTURE; id: string }
    | { type: MsgType.STATUS_FILTER_CHANGED; filter: StatusFilter }
    | { type: MsgType.APPLY_STATUS_FILTER; filter: StatusFilter }
    | { type: MsgType.RULES_CLICKED; drawId: string }
    | { type: MsgType.REWARDS_CLICKED; drawId: string; title: string }
    | { type: MsgType.BETS_LIST_CLICKED; drawId: string; title: string }
    | { type: MsgType.CREATE_BET_CLICKED; drawId: string; title: string }
    | { type: MsgType.NAVIGATE_TO_ERROR }
    | { type: MsgType.TICK };

// Action Creators
export const STATUS_FILTER_CHANGED = (filter: StatusFilter) => ({ type: MsgType.STATUS_FILTER_CHANGED, filter } as const);
export const APPLY_STATUS_FILTER = (filter: StatusFilter) => ({ type: MsgType.APPLY_STATUS_FILTER, filter } as const);

// Action Creators
export const FETCH_DATA_REQUESTED = () => ({ type: MsgType.FETCH_DATA_REQUESTED } as const);
export const REFRESH_CLICKED = () => ({ type: MsgType.REFRESH_CLICKED } as const);
export const SET_USER_STRUCTURE = (id: string) => ({ type: MsgType.SET_USER_STRUCTURE, id } as const);
export const RULES_CLICKED = (drawId: string) => ({ type: MsgType.RULES_CLICKED, drawId } as const);
export const REWARDS_CLICKED = (drawId: string, title: string) => ({ type: MsgType.REWARDS_CLICKED, drawId, title } as const);
export const BETS_LIST_CLICKED = (drawId: string, title: string) => ({ type: MsgType.BETS_LIST_CLICKED, drawId, title } as const);
export const CREATE_BET_CLICKED = (drawId: string, title: string) => ({ type: MsgType.CREATE_BET_CLICKED, drawId, title } as const);
export const NAVIGATE_TO_ERROR = () => ({ type: MsgType.NAVIGATE_TO_ERROR } as const);
export const TICK = () => ({ type: MsgType.TICK } as const);
