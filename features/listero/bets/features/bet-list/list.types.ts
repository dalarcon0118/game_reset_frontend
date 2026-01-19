import { FijosCorridosBet, ParletBet, CentenaBet, LoteriaBet } from '@/types';
import { WebData, RemoteData } from '@/shared/core/remote.data';

export interface ListData {
    fijosCorridos: FijosCorridosBet[];
    parlets: ParletBet[];
    centenas: CentenaBet[];
    loteria: LoteriaBet[];
}

export interface ListState {
    remoteData: WebData<ListData>;
    aliasFilter: string;
    isRefreshing: boolean;
}

export const initialListState: ListState = {
    remoteData: RemoteData.notAsked(),
    aliasFilter: '',
    isRefreshing: false,
};

export enum ListMsgType {
    FETCH_BETS_REQUESTED = 'FETCH_BETS_REQUESTED',
    REFRESH_BETS_REQUESTED = 'REFRESH_BETS_REQUESTED',
    FETCH_BETS_SUCCEEDED = 'FETCH_BETS_SUCCEEDED',
    FETCH_BETS_FAILED = 'FETCH_BETS_FAILED',
    REMOVE_BET = 'REMOVE_BET',
    CLEAR_LIST = 'CLEAR_LIST',
    UPDATE_LIST_FILTER = 'UPDATE_LIST_FILTER',
}

export type ListMsg =
    | { type: ListMsgType.FETCH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.REFRESH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.FETCH_BETS_SUCCEEDED; fijosCorridos: FijosCorridosBet[]; parlets: ParletBet[]; centenas: CentenaBet[]; loteria: LoteriaBet[] }
    | { type: ListMsgType.FETCH_BETS_FAILED; error: string }
    | { type: ListMsgType.REMOVE_BET; betId: string; category: 'fijosCorridos' | 'parlets' | 'centenas' | 'loteria' }
    | { type: ListMsgType.CLEAR_LIST }
    | { type: ListMsgType.UPDATE_LIST_FILTER; filter: string };

export type ListFeatMsg = { type: 'LIST'; payload: ListMsg };
