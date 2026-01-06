import { GameType } from '../../../../types';

export enum CreateMsgType {
    SET_CREATE_DRAW = 'SET_CREATE_DRAW',
    SET_CREATE_GAME_TYPE = 'SET_CREATE_GAME_TYPE',
    UPDATE_CREATE_NUMBERS = 'UPDATE_CREATE_NUMBERS',
    UPDATE_CREATE_AMOUNT = 'UPDATE_CREATE_AMOUNT',
    ADD_BET_TO_CREATE_LIST = 'ADD_BET_TO_CREATE_LIST',
    REMOVE_BET_FROM_CREATE_LIST = 'REMOVE_BET_FROM_CREATE_LIST',
    CLEAR_CREATE_SESSION = 'CLEAR_CREATE_SESSION',
    // New messages for business logic
    HANDLE_KEY_PRESS = 'HANDLE_KEY_PRESS',
    HANDLE_AMOUNT_SELECTION = 'HANDLE_AMOUNT_SELECTION',
    VALIDATE_AND_ADD_BET = 'VALIDATE_AND_ADD_BET',
    SUBMIT_CREATE_SESSION = 'SUBMIT_CREATE_SESSION',
    CONFIRM_CLEAR_BETS = 'CONFIRM_CLEAR_BETS',
}

export type CreateMsg =
    | { type: CreateMsgType.SET_CREATE_DRAW; drawId: string }
    | { type: CreateMsgType.SET_CREATE_GAME_TYPE; gameType: GameType }
    | { type: CreateMsgType.UPDATE_CREATE_NUMBERS; numbers: string }
    | { type: CreateMsgType.UPDATE_CREATE_AMOUNT; amount: string }
    | { type: CreateMsgType.ADD_BET_TO_CREATE_LIST }
    | { type: CreateMsgType.REMOVE_BET_FROM_CREATE_LIST; index: number }
    | { type: CreateMsgType.CLEAR_CREATE_SESSION }
    // New messages for business logic
    | { type: CreateMsgType.HANDLE_KEY_PRESS; key: string }
    | { type: CreateMsgType.HANDLE_AMOUNT_SELECTION; value: number }
    | { type: CreateMsgType.VALIDATE_AND_ADD_BET; drawId: string }
    | { type: CreateMsgType.SUBMIT_CREATE_SESSION }
    | { type: CreateMsgType.CONFIRM_CLEAR_BETS };
