import { GameType } from '@/types';
import { WebData, RemoteData } from '@/shared/core/remote.data';

export interface Model {
    selectedDrawId: string | null;
    selectedGameType: GameType | null;
    numbersPlayed: string;
    amount: string;
    playerAlias: string;
    submissionStatus: WebData<null>;
    tempBets: {
        gameType: GameType;
        numbers: string;
        amount: number;
    }[];
}

export const initialCreateState: Model = {
    selectedDrawId: null,
    selectedGameType: null,
    numbersPlayed: '',
    amount: '',
    playerAlias: '',
    submissionStatus: RemoteData.notAsked(),
    tempBets: [],
};

export enum CreateMsgType {
    SET_CREATE_DRAW = 'SET_CREATE_DRAW',
    SET_CREATE_GAME_TYPE = 'SET_CREATE_GAME_TYPE',
    UPDATE_CREATE_NUMBERS = 'UPDATE_CREATE_NUMBERS',
    UPDATE_CREATE_AMOUNT = 'UPDATE_CREATE_AMOUNT',
    UPDATE_CREATE_PLAYER_ALIAS = 'UPDATE_CREATE_PLAYER_ALIAS',
    ADD_BET_TO_CREATE_LIST = 'ADD_BET_TO_CREATE_LIST',
    REMOVE_BET_FROM_CREATE_LIST = 'REMOVE_BET_FROM_CREATE_LIST',
    CLEAR_CREATE_SESSION = 'CLEAR_CREATE_SESSION',
    // New messages for business logic
    HANDLE_KEY_PRESS = 'HANDLE_KEY_PRESS',
    HANDLE_AMOUNT_SELECTION = 'HANDLE_AMOUNT_SELECTION',
    VALIDATE_AND_ADD_BET = 'VALIDATE_AND_ADD_BET',
    SUBMIT_CREATE_SESSION = 'SUBMIT_CREATE_SESSION',
    CONFIRM_CLEAR_BETS = 'CONFIRM_CLEAR_BETS',
    SUBMISSION_RESULT = 'SUBMISSION_RESULT',
}

export type CreateMsg =
    | { type: CreateMsgType.SET_CREATE_DRAW; drawId: string }
    | { type: CreateMsgType.SET_CREATE_GAME_TYPE; gameType: GameType }
    | { type: CreateMsgType.UPDATE_CREATE_NUMBERS; numbers: string }
    | { type: CreateMsgType.UPDATE_CREATE_AMOUNT; amount: string }
    | { type: CreateMsgType.UPDATE_CREATE_PLAYER_ALIAS; alias: string }
    | { type: CreateMsgType.ADD_BET_TO_CREATE_LIST }
    | { type: CreateMsgType.REMOVE_BET_FROM_CREATE_LIST; index: number }
    | { type: CreateMsgType.CLEAR_CREATE_SESSION }
    // New messages for business logic
    | { type: CreateMsgType.HANDLE_KEY_PRESS; key: string }
    | { type: CreateMsgType.HANDLE_AMOUNT_SELECTION; value: number }
    | { type: CreateMsgType.VALIDATE_AND_ADD_BET; drawId: string }
    | { type: CreateMsgType.SUBMIT_CREATE_SESSION }
    | { type: CreateMsgType.CONFIRM_CLEAR_BETS }
    | { type: CreateMsgType.SUBMISSION_RESULT; result: any };

export type CreateFeatMsg = { type: 'CREATE'; payload: CreateMsg };
