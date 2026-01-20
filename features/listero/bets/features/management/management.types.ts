import { FijosCorridosBet, ParletBet, CentenaBet, GameType, BetType } from '@/types';
import { WebData, RemoteData } from '@/shared/core/remote.data';

export interface ManagementState {
    betTypes: {
        fijo: string | null;
        corrido: string | null;
        parlet: string | null;
        centena: string | null;
        loteria: string | null;
    };
    saveStatus: WebData<BetType | BetType[]>;
    saveSuccess: boolean;
}

export const initialManagementState: ManagementState = {
    betTypes: {
        fijo: null,
        corrido: null,
        parlet: null,
        centena: null,
        loteria: null,
    },
    saveStatus: RemoteData.notAsked(),
    saveSuccess: false,
};

export enum ManagementMsgType {
    FETCH_BET_TYPES_REQUESTED = 'FETCH_BET_TYPES_REQUESTED',
    FETCH_BET_TYPES_SUCCEEDED = 'FETCH_BET_TYPES_SUCCEEDED',
    FETCH_BET_TYPES_FAILED = 'FETCH_BET_TYPES_FAILED',
    SAVE_BETS_REQUESTED = 'SAVE_BETS_REQUESTED',
    SAVE_BETS_RESPONSE = 'SAVE_BETS_RESPONSE',
    SHOW_SAVE_CONFIRMATION = 'SHOW_SAVE_CONFIRMATION',
    RESET_BETS = 'RESET_BETS',
    CLEAR_MANAGEMENT_ERROR = 'CLEAR_MANAGEMENT_ERROR',
    INIT = 'INIT',
    NAVIGATE_REQUESTED = 'NAVIGATE_REQUESTED',
    DISCARD_CHANGES_CONFIRMED = 'DISCARD_CHANGES_CONFIRMED',
    SHARE_FAILED = 'SHARE_FAILED',
    NONE = 'NONE',
}

export type ManagementMsg =
    | { type: ManagementMsgType.INIT; drawId: string; fetchExistingBets?: boolean }
    | { type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED; drawId: string }
    | { type: ManagementMsgType.FETCH_BET_TYPES_SUCCEEDED; betTypes: GameType[] }
    | { type: ManagementMsgType.FETCH_BET_TYPES_FAILED; error: string }
    | { type: ManagementMsgType.SAVE_BETS_REQUESTED; drawId: string }
    | { type: ManagementMsgType.SAVE_BETS_RESPONSE; response: WebData<BetType | BetType[]> }
    | { type: ManagementMsgType.SHOW_SAVE_CONFIRMATION; drawId: string }
    | { type: ManagementMsgType.RESET_BETS }
    | { type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR }
    | { type: ManagementMsgType.NAVIGATE_REQUESTED; onConfirm: () => void }
    | { type: ManagementMsgType.DISCARD_CHANGES_CONFIRMED; onConfirm: () => void }
    | { type: ManagementMsgType.SHARE_FAILED; error: string }
    | { type: ManagementMsgType.NONE };

export type ManagementFeatMsg = { type: 'MANAGEMENT'; payload: ManagementMsg };
