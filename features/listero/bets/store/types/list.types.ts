import { FijosCorridosBet, ParletBet, CentenaBet } from '../../../../types';

export enum ListMsgType {
    FETCH_BETS_REQUESTED = 'FETCH_BETS_REQUESTED',
    FETCH_BETS_SUCCEEDED = 'FETCH_BETS_SUCCEEDED',
    FETCH_BETS_FAILED = 'FETCH_BETS_FAILED',
}

export type ListMsg =
    | { type: ListMsgType.FETCH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.FETCH_BETS_SUCCEEDED; fijosCorridos: FijosCorridosBet[]; parlets: ParletBet[]; centenas: CentenaBet[] }
    | { type: ListMsgType.FETCH_BETS_FAILED; error: string };
