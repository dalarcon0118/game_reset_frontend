import { CentenaBet, GameType } from '@/types';

export interface Model {
    activeCentenaBetId: string | null;
    isCentenaDrawerVisible: boolean;
    isCentenaModalVisible: boolean;
    isAmountDrawerVisible: boolean;
    activeAnnotationType: string | null;
    activeGameType: GameType | null;
}

export const initialCentenaState: Model = {
    activeCentenaBetId: null,
    isCentenaDrawerVisible: false,
    isCentenaModalVisible: false,
    isAmountDrawerVisible: false,
    activeAnnotationType: null,
    activeGameType: null,
};

export enum CentenaMsgType {
    PRESS_ADD_CENTENA = 'PRESS_ADD_CENTENA',
    CONFIRM_CENTENA_BET = 'CONFIRM_CENTENA_BET',
    CANCEL_CENTENA_BET = 'CANCEL_CENTENA_BET',
    EDIT_CENTENA_BET = 'EDIT_CENTENA_BET',
    DELETE_CENTENA_BET = 'DELETE_CENTENA_BET',
    UPDATE_CENTENA_BET = 'UPDATE_CENTENA_BET',
    OPEN_CENTENA_AMOUNT_KEYBOARD = 'OPEN_CENTENA_AMOUNT_KEYBOARD',
    SHOW_CENTENA_DRAWER = 'SHOW_CENTENA_DRAWER',
    SHOW_CENTENA_MODAL = 'SHOW_CENTENA_MODAL',
    PROCESS_BET_INPUT = 'PROCESS_BET_INPUT',
    SUBMIT_AMOUNT_INPUT = 'SUBMIT_AMOUNT_INPUT',
    KEY_PRESSED = 'KEY_PRESSED',
    CONFIRM_INPUT = 'CONFIRM_INPUT',
}

export type CentenaMsg =
    | { type: CentenaMsgType.PRESS_ADD_CENTENA }
    | { type: CentenaMsgType.CONFIRM_CENTENA_BET; betNumber: number }
    | { type: CentenaMsgType.CANCEL_CENTENA_BET }
    | { type: CentenaMsgType.EDIT_CENTENA_BET; betId: string }
    | { type: CentenaMsgType.DELETE_CENTENA_BET; betId: string }
    | { type: CentenaMsgType.UPDATE_CENTENA_BET; betId: string; changes: Partial<CentenaBet> }
    | { type: CentenaMsgType.OPEN_CENTENA_AMOUNT_KEYBOARD; betId: string }
    | { type: CentenaMsgType.SHOW_CENTENA_DRAWER; visible: boolean }
    | { type: CentenaMsgType.SHOW_CENTENA_MODAL; visible: boolean }
    | { type: CentenaMsgType.PROCESS_BET_INPUT; inputString: string }
    | { type: CentenaMsgType.SUBMIT_AMOUNT_INPUT; amountString: string }
    | { type: CentenaMsgType.KEY_PRESSED; key: string }
    | { type: CentenaMsgType.CONFIRM_INPUT };

export type CentenaFeatMsg = { type: 'CENTENA'; payload: CentenaMsg };