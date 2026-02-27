import { createMsg } from '@/shared/core/msg';
import { FijosCorridosBet } from "@/types";

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
export const KEY_PRESSED = createMsg<'KEY_PRESSED', { key: string }>('KEY_PRESSED');
export const CONFIRM_INPUT = createMsg<'CONFIRM_INPUT', void>('CONFIRM_INPUT');

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
  | typeof KEY_PRESSED._type
  | typeof CONFIRM_INPUT._type;

export const FijosCmd = {
  OPEN_BET_KEYBOARD: () => OPEN_BET_KEYBOARD(),
  CLOSE_BET_KEYBOARD: () => CLOSE_BET_KEYBOARD(),
  OPEN_AMOUNT_KEYBOARD: (betId: string, amountType: 'fijo' | 'corrido') => OPEN_AMOUNT_KEYBOARD({ betId, amountType }),
  CLOSE_AMOUNT_KEYBOARD: () => CLOSE_AMOUNT_KEYBOARD(),
  PROCESS_BET_INPUT: (inputString: string) => PROCESS_BET_INPUT({ inputString }),
  SUBMIT_AMOUNT_INPUT: (amountString: string) => SUBMIT_AMOUNT_INPUT({ amountString }),
  CONFIRM_APPLY_AMOUNT_ALL: () => CONFIRM_APPLY_AMOUNT_ALL(),
  CONFIRM_APPLY_AMOUNT_SINGLE: () => CONFIRM_APPLY_AMOUNT_SINGLE(),
  CANCEL_AMOUNT_CONFIRMATION: () => CANCEL_AMOUNT_CONFIRMATION(),
  KEY_PRESSED: (key: string) => KEY_PRESSED({ key }),
  CONFIRM_INPUT: () => CONFIRM_INPUT(),
};
