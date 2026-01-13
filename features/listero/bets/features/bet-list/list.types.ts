import { FijosCorridosBet, ParletBet, CentenaBet } from '@/types';

export interface ListState {
    fijosCorridos: FijosCorridosBet[];
    parlets: ParletBet[];
    centenas: CentenaBet[];
    isLoading: boolean;
    error: string | null;
    aliasFilter: string;
}

export const initialListState: ListState = {
    fijosCorridos: [],
    parlets: [],
    centenas: [],
    isLoading: false,
    error: null,
    aliasFilter: '',
};

export enum ListMsgType {
    FETCH_BETS_REQUESTED = 'FETCH_BETS_REQUESTED',
    FETCH_BETS_SUCCEEDED = 'FETCH_BETS_SUCCEEDED',
    FETCH_BETS_FAILED = 'FETCH_BETS_FAILED',
    REMOVE_BET = 'REMOVE_BET',
    CLEAR_LIST = 'CLEAR_LIST',
    UPDATE_LIST_FILTER = 'UPDATE_LIST_FILTER',
}

export type ListMsg =
    | { type: ListMsgType.FETCH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.FETCH_BETS_SUCCEEDED; fijosCorridos: FijosCorridosBet[]; parlets: ParletBet[]; centenas: CentenaBet[] }
    | { type: ListMsgType.FETCH_BETS_FAILED; error: string }
    | { type: ListMsgType.REMOVE_BET; betId: string; category: 'fijosCorridos' | 'parlets' | 'centenas' }
    | { type: ListMsgType.CLEAR_LIST }
    | { type: ListMsgType.UPDATE_LIST_FILTER; filter: string };
