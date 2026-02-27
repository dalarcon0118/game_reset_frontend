import { createMsg } from '@/shared/core/msg';
import { BolitaListData } from './model';

export enum ListMsgType {
    FETCH_BETS_REQUESTED = 'FETCH_BETS_REQUESTED',
    FETCH_BETS_SUCCEEDED = 'FETCH_BETS_SUCCEEDED',
    FETCH_BETS_FAILED = 'FETCH_BETS_FAILED',
    REFRESH_BETS_REQUESTED = 'REFRESH_BETS_REQUESTED',
    REFRESH_BETS_SUCCEEDED = 'REFRESH_BETS_SUCCEEDED',
    REFRESH_BETS_FAILED = 'REFRESH_BETS_FAILED',
}

export type ListMsg =
    | { type: ListMsgType.FETCH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.FETCH_BETS_SUCCEEDED } & BolitaListData
    | { type: ListMsgType.FETCH_BETS_FAILED; error: string }
    | { type: ListMsgType.REFRESH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.REFRESH_BETS_SUCCEEDED } & BolitaListData
    | { type: ListMsgType.REFRESH_BETS_FAILED; error: string };
