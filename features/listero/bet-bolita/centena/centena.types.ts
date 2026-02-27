import { createMsg } from '@/shared/core/msg';
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

export const PRESS_ADD_CENTENA = createMsg<'PRESS_ADD_CENTENA', void>('PRESS_ADD_CENTENA');
export const CONFIRM_CENTENA_BET = createMsg<'CONFIRM_CENTENA_BET', { betNumber: number }>('CONFIRM_CENTENA_BET');
export const CANCEL_CENTENA_BET = createMsg<'CANCEL_CENTENA_BET', void>('CANCEL_CENTENA_BET');
export const EDIT_CENTENA_BET = createMsg<'EDIT_CENTENA_BET', { betId: string }>('EDIT_CENTENA_BET');
export const DELETE_CENTENA_BET = createMsg<'DELETE_CENTENA_BET', { betId: string }>('DELETE_CENTENA_BET');
export const UPDATE_CENTENA_BET = createMsg<'UPDATE_CENTENA_BET', { betId: string; changes: Partial<CentenaBet> }>('UPDATE_CENTENA_BET');
export const OPEN_CENTENA_AMOUNT_KEYBOARD = createMsg<'OPEN_CENTENA_AMOUNT_KEYBOARD', { betId: string }>('OPEN_CENTENA_AMOUNT_KEYBOARD');
export const SHOW_CENTENA_DRAWER = createMsg<'SHOW_CENTENA_DRAWER', { visible: boolean }>('SHOW_CENTENA_DRAWER');
export const SHOW_CENTENA_MODAL = createMsg<'SHOW_CENTENA_MODAL', { visible: boolean }>('SHOW_CENTENA_MODAL');
export const PROCESS_BET_INPUT = createMsg<'PROCESS_BET_INPUT', { inputString: string }>('PROCESS_BET_INPUT');
export const SUBMIT_AMOUNT_INPUT = createMsg<'SUBMIT_AMOUNT_INPUT', { amountString: string }>('SUBMIT_AMOUNT_INPUT');
export const KEY_PRESSED = createMsg<'KEY_PRESSED', { key: string }>('KEY_PRESSED');
export const CONFIRM_INPUT = createMsg<'CONFIRM_INPUT', void>('CONFIRM_INPUT');

export type CentenaMsg =
    | typeof PRESS_ADD_CENTENA._type
    | typeof CONFIRM_CENTENA_BET._type
    | typeof CANCEL_CENTENA_BET._type
    | typeof EDIT_CENTENA_BET._type
    | typeof DELETE_CENTENA_BET._type
    | typeof UPDATE_CENTENA_BET._type
    | typeof OPEN_CENTENA_AMOUNT_KEYBOARD._type
    | typeof SHOW_CENTENA_DRAWER._type
    | typeof SHOW_CENTENA_MODAL._type
    | typeof PROCESS_BET_INPUT._type
    | typeof SUBMIT_AMOUNT_INPUT._type
    | typeof KEY_PRESSED._type
    | typeof CONFIRM_INPUT._type;