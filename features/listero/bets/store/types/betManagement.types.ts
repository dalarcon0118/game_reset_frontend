import { FijosCorridosBet, ParletBet, CentenaBet } from '../../../../types';

export enum BetManagementMsgType {
    UPDATE_FIJOS_CORRIDOS = 'UPDATE_FIJOS_CORRIDOS',
    UPDATE_PARLETS = 'UPDATE_PARLETS',
    UPDATE_CENTENAS = 'UPDATE_CENTENAS',
    SAVE_BETS_REQUESTED = 'SAVE_BETS_REQUESTED',
    SAVE_BETS_SUCCEEDED = 'SAVE_BETS_SUCCEEDED',
    SAVE_BETS_FAILED = 'SAVE_BETS_FAILED',
    RESET_BETS = 'RESET_BETS',
}

export type BetManagementMsg =
    | { type: BetManagementMsgType.UPDATE_FIJOS_CORRIDOS; bets: FijosCorridosBet[] }
    | { type: BetManagementMsgType.UPDATE_PARLETS; bets: ParletBet[] }
    | { type: BetManagementMsgType.UPDATE_CENTENAS; bets: CentenaBet[] }
    | { type: BetManagementMsgType.SAVE_BETS_REQUESTED; drawId: string }
    | { type: BetManagementMsgType.SAVE_BETS_SUCCEEDED; response: any }
    | { type: BetManagementMsgType.SAVE_BETS_FAILED; error: string }
    | { type: BetManagementMsgType.RESET_BETS };
