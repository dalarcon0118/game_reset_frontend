import { FijosCorridosBet, ParletBet, CentenaBet, GameType } from '@/types';

export interface ManagementState {
    betTypes: {
        fijo: string | null;
        corrido: string | null;
        parlet: string | null;
        centena: string | null;
        loteria: string | null;
    };
    isSaving: boolean;
    saveSuccess: boolean;
    error: string | null;
}

export const initialManagementState: ManagementState = {
    betTypes: {
        fijo: null,
        corrido: null,
        parlet: null,
        centena: null,
        loteria: null,
    },
    isSaving: false,
    saveSuccess: false,
    error: null,
};

export enum ManagementMsgType {
    FETCH_BET_TYPES_REQUESTED = 'FETCH_BET_TYPES_REQUESTED',
    FETCH_BET_TYPES_SUCCEEDED = 'FETCH_BET_TYPES_SUCCEEDED',
    FETCH_BET_TYPES_FAILED = 'FETCH_BET_TYPES_FAILED',
    SAVE_BETS_REQUESTED = 'SAVE_BETS_REQUESTED',
    SAVE_BETS_SUCCEEDED = 'SAVE_BETS_SUCCEEDED',
    SAVE_BETS_FAILED = 'SAVE_BETS_FAILED',
    RESET_BETS = 'RESET_BETS',
    CLEAR_MANAGEMENT_ERROR = 'CLEAR_MANAGEMENT_ERROR',
    INIT = 'INIT',
}

export type ManagementMsg =
    | { type: ManagementMsgType.INIT; drawId: string; fetchExistingBets?: boolean }
    | { type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED; drawId: string }
    | { type: ManagementMsgType.FETCH_BET_TYPES_SUCCEEDED; betTypes: GameType[] }
    | { type: ManagementMsgType.FETCH_BET_TYPES_FAILED; error: string }
    | { type: ManagementMsgType.SAVE_BETS_REQUESTED; drawId: string }
    | { type: ManagementMsgType.SAVE_BETS_SUCCEEDED; response: any }
    | { type: ManagementMsgType.SAVE_BETS_FAILED; error: string }
    | { type: ManagementMsgType.RESET_BETS }
    | { type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR };

export type ManagementFeatMsg = { type: 'MANAGEMENT'; payload: ManagementMsg };
