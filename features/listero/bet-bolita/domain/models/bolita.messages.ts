import { createMsg, WebData } from '@/shared/core/tea-utils';
import { BetType, ParletBet, CentenaBet, FijosCorridosBet } from '@/types';
import { BolitaListData } from '../models/bolita.types';

// ============================================================================
// Parlet Messages
// ============================================================================

export const PRESS_ADD_PARLET = createMsg<'PRESS_ADD_PARLET', { fijosCorridosList: FijosCorridosBet[] }>('PRESS_ADD_PARLET');
export const CONFIRM_PARLET_BET = createMsg<'CONFIRM_PARLET_BET', { numbers: number[] }>('CONFIRM_PARLET_BET');
export const CANCEL_PARLET_BET = createMsg<'CANCEL_PARLET_BET', void>('CANCEL_PARLET_BET');
export const EDIT_PARLET_BET = createMsg<'EDIT_PARLET_BET', { betId: string }>('EDIT_PARLET_BET');
export const DELETE_PARLET_BET = createMsg<'DELETE_PARLET_BET', { betId: string }>('DELETE_PARLET_BET');
export const UPDATE_PARLET_BET = createMsg<'UPDATE_PARLET_BET', { betId: string; changes: Partial<ParletBet> }>('UPDATE_PARLET_BET');
export const OPEN_PARLET_AMOUNT_KEYBOARD = createMsg<'OPEN_PARLET_AMOUNT_KEYBOARD', { betId: string }>('OPEN_PARLET_AMOUNT_KEYBOARD');
export const SHOW_PARLET_DRAWER = createMsg<'SHOW_PARLET_DRAWER', { visible: boolean }>('SHOW_PARLET_DRAWER');
export const SHOW_PARLET_MODAL = createMsg<'SHOW_PARLET_MODAL', { visible: boolean }>('SHOW_PARLET_MODAL');
export const SHOW_PARLET_ALERT = createMsg<'SHOW_PARLET_ALERT', { visible: boolean }>('SHOW_PARLET_ALERT');
export const PROCESS_PARLET_INPUT = createMsg<'PROCESS_PARLET_INPUT', { inputString: string }>('PROCESS_PARLET_INPUT');
export const SUBMIT_PARLET_AMOUNT_INPUT = createMsg<'SUBMIT_PARLET_AMOUNT_INPUT', { amountString: string }>('SUBMIT_PARLET_AMOUNT_INPUT');
export const PARLET_KEY_PRESSED = createMsg<'PARLET_KEY_PRESSED', { key: string }>('PARLET_KEY_PRESSED');
export const PARLET_CONFIRM_INPUT = createMsg<'PARLET_CONFIRM_INPUT', void>('PARLET_CONFIRM_INPUT');
export const CLOSE_PARLET_AMOUNT_KEYBOARD = createMsg<'CLOSE_PARLET_AMOUNT_KEYBOARD', void>('CLOSE_PARLET_AMOUNT_KEYBOARD');
export const CLOSE_PARLET_BET_KEYBOARD = createMsg<'CLOSE_PARLET_BET_KEYBOARD', void>('CLOSE_PARLET_BET_KEYBOARD');

export const ParletMessages = {
    PRESS_ADD_PARLET,
    CONFIRM_PARLET_BET,
    CANCEL_PARLET_BET,
    EDIT_PARLET_BET,
    DELETE_PARLET_BET,
    UPDATE_PARLET_BET,
    OPEN_PARLET_AMOUNT_KEYBOARD,
    SHOW_PARLET_DRAWER,
    SHOW_PARLET_MODAL,
    SHOW_PARLET_ALERT,
    PROCESS_PARLET_INPUT,
    SUBMIT_PARLET_AMOUNT_INPUT,
    PARLET_KEY_PRESSED,
    PARLET_CONFIRM_INPUT,
    CLOSE_PARLET_AMOUNT_KEYBOARD,
    CLOSE_PARLET_BET_KEYBOARD,
};

export type ParletMsg =
    | typeof PRESS_ADD_PARLET._type
    | typeof CONFIRM_PARLET_BET._type
    | typeof CANCEL_PARLET_BET._type
    | typeof EDIT_PARLET_BET._type
    | typeof DELETE_PARLET_BET._type
    | typeof UPDATE_PARLET_BET._type
    | typeof OPEN_PARLET_AMOUNT_KEYBOARD._type
    | typeof SHOW_PARLET_DRAWER._type
    | typeof SHOW_PARLET_MODAL._type
    | typeof SHOW_PARLET_ALERT._type
    | typeof PROCESS_PARLET_INPUT._type
    | typeof SUBMIT_PARLET_AMOUNT_INPUT._type
    | typeof PARLET_KEY_PRESSED._type
    | typeof PARLET_CONFIRM_INPUT._type
    | typeof CLOSE_PARLET_AMOUNT_KEYBOARD._type
    | typeof CLOSE_PARLET_BET_KEYBOARD._type;

// ============================================================================
// Fijos Messages
// ============================================================================

export const ADD_FIJOS_BET = createMsg<'ADD_FIJOS_BET', { fijosBet: { number: number; fijoAmount?: number; corridoAmount?: number } }>('ADD_FIJOS_BET');
export const UPDATE_FIJOS_BET = createMsg<'UPDATE_FIJOS_BET', { betId: string; changes: Partial<FijosCorridosBet> }>('UPDATE_FIJOS_BET');
export const DELETE_FIJOS_BET = createMsg<'DELETE_FIJOS_BET', { betId: string }>('DELETE_FIJOS_BET');
export const SET_FIJOS_AMOUNT = createMsg<'SET_FIJOS_AMOUNT', { amount: number }>('SET_FIJOS_AMOUNT');
export const SET_CORRIDO_AMOUNT = createMsg<'SET_CORRIDO_AMOUNT', { amount: number }>('SET_CORRIDO_AMOUNT');
export const OPEN_BET_KEYBOARD = createMsg<'OPEN_BET_KEYBOARD', void>('OPEN_BET_KEYBOARD');
export const CLOSE_BET_KEYBOARD = createMsg<'CLOSE_BET_KEYBOARD', void>('CLOSE_BET_KEYBOARD');
export const OPEN_AMOUNT_KEYBOARD = createMsg<'OPEN_AMOUNT_KEYBOARD', { betId: string; amountType: 'fijo' | 'corrido' }>('OPEN_AMOUNT_KEYBOARD');
export const CLOSE_AMOUNT_KEYBOARD = createMsg<'CLOSE_AMOUNT_KEYBOARD', void>('CLOSE_AMOUNT_KEYBOARD');
export const PROCESS_BET_INPUT = createMsg<'PROCESS_BET_INPUT', { inputString: string }>('PROCESS_BET_INPUT');
export const SUBMIT_AMOUNT_INPUT = createMsg<'SUBMIT_AMOUNT_INPUT', { amountString: string }>('SUBMIT_AMOUNT_INPUT');
export const CONFIRM_APPLY_AMOUNT_ALL = createMsg<'CONFIRM_APPLY_AMOUNT_ALL', void>('CONFIRM_APPLY_AMOUNT_ALL');
export const CONFIRM_APPLY_AMOUNT_SINGLE = createMsg<'CONFIRM_APPLY_AMOUNT_SINGLE', void>('CONFIRM_APPLY_AMOUNT_SINGLE');
export const CANCEL_AMOUNT_CONFIRMATION = createMsg<'CANCEL_AMOUNT_CONFIRMATION', void>('CANCEL_AMOUNT_CONFIRMATION');
export const CONFIRM_PARLET_AUTOFILL = createMsg<'CONFIRM_PARLET_AUTOFILL', { numbers: number[] }>('CONFIRM_PARLET_AUTOFILL');
export const CANCEL_PARLET_AUTOFILL = createMsg<'CANCEL_PARLET_AUTOFILL', void>('CANCEL_PARLET_AUTOFILL');
export const FIJOS_KEY_PRESSED = createMsg<'FIJOS_KEY_PRESSED', { key: string }>('FIJOS_KEY_PRESSED');
export const FIJOS_CONFIRM_INPUT = createMsg<'FIJOS_CONFIRM_INPUT', void>('FIJOS_CONFIRM_INPUT');

export const FijosMessages = {
    ADD_FIJOS_BET,
    UPDATE_FIJOS_BET,
    DELETE_FIJOS_BET,
    SET_FIJOS_AMOUNT,
    SET_CORRIDO_AMOUNT,
    OPEN_BET_KEYBOARD,
    CLOSE_BET_KEYBOARD,
    OPEN_AMOUNT_KEYBOARD,
    CLOSE_AMOUNT_KEYBOARD,
    PROCESS_BET_INPUT,
    SUBMIT_AMOUNT_INPUT,
    CONFIRM_APPLY_AMOUNT_ALL,
    CONFIRM_APPLY_AMOUNT_SINGLE,
    CANCEL_AMOUNT_CONFIRMATION,
    CONFIRM_PARLET_AUTOFILL,
    CANCEL_PARLET_AUTOFILL,
    FIJOS_KEY_PRESSED,
    FIJOS_CONFIRM_INPUT,
};

export type FijosMsg =
    | typeof ADD_FIJOS_BET._type
    | typeof UPDATE_FIJOS_BET._type
    | typeof DELETE_FIJOS_BET._type
    | typeof SET_FIJOS_AMOUNT._type
    | typeof SET_CORRIDO_AMOUNT._type
    | typeof OPEN_BET_KEYBOARD._type
    | typeof CLOSE_BET_KEYBOARD._type
    | typeof OPEN_AMOUNT_KEYBOARD._type
    | typeof CLOSE_AMOUNT_KEYBOARD._type
    | typeof PROCESS_BET_INPUT._type
    | typeof SUBMIT_AMOUNT_INPUT._type
    | typeof CONFIRM_APPLY_AMOUNT_ALL._type
    | typeof CONFIRM_APPLY_AMOUNT_SINGLE._type
    | typeof CANCEL_AMOUNT_CONFIRMATION._type
    | typeof CONFIRM_PARLET_AUTOFILL._type
    | typeof CANCEL_PARLET_AUTOFILL._type
    | typeof FIJOS_KEY_PRESSED._type
    | typeof FIJOS_CONFIRM_INPUT._type;

// ============================================================================
// Centena Messages
// ============================================================================

export const PRESS_ADD_CENTENA = createMsg<'PRESS_ADD_CENTENA', void>('PRESS_ADD_CENTENA');
export const CANCEL_CENTENA_BET = createMsg<'CANCEL_CENTENA_BET', void>('CANCEL_CENTENA_BET');
export const EDIT_CENTENA_BET = createMsg<'EDIT_CENTENA_BET', { betId: string }>('EDIT_CENTENA_BET');
export const DELETE_CENTENA_BET = createMsg<'DELETE_CENTENA_BET', { betId: string }>('DELETE_CENTENA_BET');
export const UPDATE_CENTENA_BET = createMsg<'UPDATE_CENTENA_BET', { betId: string; changes: Partial<CentenaBet> }>('UPDATE_CENTENA_BET');
export const OPEN_CENTENA_AMOUNT_KEYBOARD = createMsg<'OPEN_CENTENA_AMOUNT_KEYBOARD', { betId: string }>('OPEN_CENTENA_AMOUNT_KEYBOARD');
export const CLOSE_CENTENA_BET_KEYBOARD = createMsg<'CLOSE_CENTENA_BET_KEYBOARD', void>('CLOSE_CENTENA_BET_KEYBOARD');
export const CLOSE_CENTENA_AMOUNT_KEYBOARD = createMsg<'CLOSE_CENTENA_AMOUNT_KEYBOARD', void>('CLOSE_CENTENA_AMOUNT_KEYBOARD');
export const SHOW_CENTENA_DRAWER = createMsg<'SHOW_CENTENA_DRAWER', { visible: boolean }>('SHOW_CENTENA_DRAWER');
export const SHOW_CENTENA_MODAL = createMsg<'SHOW_CENTENA_MODAL', { visible: boolean }>('SHOW_CENTENA_MODAL');
export const PROCESS_CENTENA_BET_INPUT = createMsg<'PROCESS_CENTENA_BET_INPUT', { inputString: string }>('PROCESS_CENTENA_BET_INPUT');
export const SUBMIT_CENTENA_AMOUNT_INPUT = createMsg<'SUBMIT_CENTENA_AMOUNT_INPUT', { amountString: string }>('SUBMIT_CENTENA_AMOUNT_INPUT');
export const CENTENA_CONFIRM_INPUT = createMsg<'CENTENA_CONFIRM_INPUT', void>('CENTENA_CONFIRM_INPUT');

export const CentenaMessages = {
    PRESS_ADD_CENTENA,
    CANCEL_CENTENA_BET,
    EDIT_CENTENA_BET,
    DELETE_CENTENA_BET,
    UPDATE_CENTENA_BET,
    OPEN_CENTENA_AMOUNT_KEYBOARD,
    CLOSE_CENTENA_BET_KEYBOARD,
    CLOSE_CENTENA_AMOUNT_KEYBOARD,
    SHOW_CENTENA_DRAWER,
    SHOW_CENTENA_MODAL,
    PROCESS_CENTENA_BET_INPUT,
    SUBMIT_CENTENA_AMOUNT_INPUT,
    CENTENA_CONFIRM_INPUT,
};

export type CentenaMsg =
    | typeof PRESS_ADD_CENTENA._type
    | typeof CANCEL_CENTENA_BET._type
    | typeof EDIT_CENTENA_BET._type
    | typeof DELETE_CENTENA_BET._type
    | typeof UPDATE_CENTENA_BET._type
    | typeof OPEN_CENTENA_AMOUNT_KEYBOARD._type
    | typeof CLOSE_CENTENA_BET_KEYBOARD._type
    | typeof CLOSE_CENTENA_AMOUNT_KEYBOARD._type
    | typeof SHOW_CENTENA_DRAWER._type
    | typeof SHOW_CENTENA_MODAL._type
    | typeof PROCESS_CENTENA_BET_INPUT._type
    | typeof SUBMIT_CENTENA_AMOUNT_INPUT._type
    | typeof CENTENA_CONFIRM_INPUT._type;

// ============================================================================
// List Messages
// ============================================================================

export enum ListMsgType {
    FETCH_BETS_REQUESTED = 'FETCH_BETS_REQUESTED',
    FETCH_BETS_RECEIVED = 'FETCH_BETS_RECEIVED',
    FETCH_BETS_SUCCEEDED = 'FETCH_BETS_SUCCEEDED',
    FETCH_BETS_FAILED = 'FETCH_BETS_FAILED',
    REFRESH_BETS_REQUESTED = 'REFRESH_BETS_REQUESTED',
    REFRESH_BETS_RECEIVED = 'REFRESH_BETS_RECEIVED',
    REFRESH_BETS_SUCCEEDED = 'REFRESH_BETS_SUCCEEDED',
    REFRESH_BETS_FAILED = 'REFRESH_BETS_FAILED',
}

export type ListMsg =
    | { type: ListMsgType.FETCH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.FETCH_BETS_RECEIVED; webData: WebData<BolitaListData> }
    | { type: ListMsgType.FETCH_BETS_SUCCEEDED } & BolitaListData
    | { type: ListMsgType.FETCH_BETS_FAILED; error: string }
    | { type: ListMsgType.REFRESH_BETS_REQUESTED; drawId: string }
    | { type: ListMsgType.REFRESH_BETS_RECEIVED; webData: WebData<BolitaListData> }
    | { type: ListMsgType.REFRESH_BETS_SUCCEEDED } & BolitaListData
    | { type: ListMsgType.REFRESH_BETS_FAILED; error: string };

// ============================================================================
// Edit Messages
// ============================================================================

export enum EditMsgType {
    SET_EDIT_SELECTED_COLUMN = 'SET_EDIT_SELECTED_COLUMN',
    SET_EDIT_SELECTED_CIRCLE = 'SET_EDIT_SELECTED_CIRCLE',
    TOGGLE_RANGE_MODE = 'TOGGLE_RANGE_MODE',
    SET_RANGE_TYPE = 'SET_RANGE_TYPE',
    GENERATE_RANGE_BETS = 'GENERATE_RANGE_BETS',
    UPDATE_EDIT_INPUT = 'UPDATE_EDIT_INPUT',
}

export type EditMsg =
    | { type: EditMsgType.SET_EDIT_SELECTED_COLUMN; column: string | null }
    | { type: EditMsgType.SET_EDIT_SELECTED_CIRCLE; circle: number | null }
    | { type: EditMsgType.TOGGLE_RANGE_MODE; enabled: boolean }
    | { type: EditMsgType.SET_RANGE_TYPE; rangeType: 'continuous' | 'terminal' | null }
    | { type: EditMsgType.GENERATE_RANGE_BETS; start: string; end: string }
    | { type: EditMsgType.UPDATE_EDIT_INPUT; value: string };

// ============================================================================
// Root Feature Messages
// ============================================================================

export const PARLET = createMsg<'PARLET', ParletMsg>('PARLET');
export const FIJOS = createMsg<'FIJOS', FijosMsg>('FIJOS');
export const CENTENA = createMsg<'CENTENA', CentenaMsg>('CENTENA');
export const LIST = createMsg<'LIST', ListMsg>('LIST');
export const EDIT = createMsg<'EDIT', EditMsg>('EDIT');
export const KEY_PRESSED = createMsg<'KEY_PRESSED', { key: string }>('KEY_PRESSED');
export const REQUEST_SAVE_ALL_BETS = createMsg<'REQUEST_SAVE_ALL_BETS', { drawId: string }>('REQUEST_SAVE_ALL_BETS');
export const CONFIRM_SAVE_ALL_BETS = createMsg<'CONFIRM_SAVE_ALL_BETS', { drawId: string }>('CONFIRM_SAVE_ALL_BETS');
export const SET_USER_CONTEXT = createMsg<'SET_USER_CONTEXT', { structureId: number }>('SET_USER_CONTEXT');
export const SAVE_BETS_RESPONSE = createMsg<'SAVE_BETS_RESPONSE', { response: WebData<BetType[]> }>('SAVE_BETS_RESPONSE');
export const BOLITA_BETS_UPDATED = createMsg<'BOLITA_BETS_UPDATED', void>('BOLITA_BETS_UPDATED');

export const CLOSE_KEYBOARD = createMsg<'CLOSE_KEYBOARD', void>('CLOSE_KEYBOARD');
export const CONFIRM_INPUT = createMsg<'CONFIRM_INPUT', void>('CONFIRM_INPUT');

export type BolitaMsg =
    | typeof PARLET._type
    | typeof FIJOS._type
    | typeof CENTENA._type
    | typeof LIST._type
    | typeof EDIT._type
    | typeof KEY_PRESSED._type
    | typeof REQUEST_SAVE_ALL_BETS._type
    | typeof CONFIRM_SAVE_ALL_BETS._type
    | typeof SET_USER_CONTEXT._type
    | typeof SAVE_BETS_RESPONSE._type
    | typeof BOLITA_BETS_UPDATED._type
    | typeof CLOSE_KEYBOARD._type
    | typeof CONFIRM_INPUT._type;
