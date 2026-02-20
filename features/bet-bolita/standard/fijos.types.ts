import { FijosCorridosBet } from "@/types";


export enum FijosMsgType {
  ADD_FIJOS_BET = 'ADD_FIJOS_BET',
  UPDATE_FIJOS_BET = 'UPDATE_FIJOS_BET',
  DELETE_FIJOS_BET = 'DELETE_FIJOS_BET',
  SET_FIJOS_AMOUNT = 'SET_FIJOS_AMOUNT',
  SET_CORRIDO_AMOUNT = 'SET_CORRIDO_AMOUNT',
  OPEN_BET_KEYBOARD = 'OPEN_BET_KEYBOARD',
  CLOSE_BET_KEYBOARD = 'CLOSE_BET_KEYBOARD',
  OPEN_AMOUNT_KEYBOARD = 'OPEN_AMOUNT_KEYBOARD',
  CLOSE_AMOUNT_KEYBOARD = 'CLOSE_AMOUNT_KEYBOARD',
  PROCESS_BET_INPUT = 'PROCESS_BET_INPUT',
  SUBMIT_AMOUNT_INPUT = 'SUBMIT_AMOUNT_INPUT',
  CONFIRM_APPLY_AMOUNT_ALL = 'CONFIRM_APPLY_AMOUNT_ALL',
  CONFIRM_APPLY_AMOUNT_SINGLE = 'CONFIRM_APPLY_AMOUNT_SINGLE',
  CANCEL_AMOUNT_CONFIRMATION = 'CANCEL_AMOUNT_CONFIRMATION',
  CONFIRM_PARLET_AUTOFILL = 'CONFIRM_PARLET_AUTOFILL',
  CANCEL_PARLET_AUTOFILL = 'CANCEL_PARLET_AUTOFILL',
  KEY_PRESSED = 'KEY_PRESSED',
  CONFIRM_INPUT = 'CONFIRM_INPUT',
}

const createMsg = <T extends FijosMsg>(type: T): FijosFeatMsg => ({
  type: 'FIJOS',
  payload: type
});

export type FijosMsg =
  | { type: FijosMsgType.ADD_FIJOS_BET; fijosBet: { number: number; fijoAmount?: number; corridoAmount?: number } }
  | { type: FijosMsgType.UPDATE_FIJOS_BET; betId: string; changes: Partial<FijosCorridosBet> }
  | { type: FijosMsgType.DELETE_FIJOS_BET; betId: string }
  | { type: FijosMsgType.SET_FIJOS_AMOUNT; amount: number }
  | { type: FijosMsgType.SET_CORRIDO_AMOUNT; amount: number }
  | { type: FijosMsgType.OPEN_BET_KEYBOARD }
  | { type: FijosMsgType.CLOSE_BET_KEYBOARD }
  | { type: FijosMsgType.OPEN_AMOUNT_KEYBOARD; betId: string; amountType: 'fijo' | 'corrido' }
  | { type: FijosMsgType.CLOSE_AMOUNT_KEYBOARD }
  | { type: FijosMsgType.PROCESS_BET_INPUT; inputString: string }
  | { type: FijosMsgType.SUBMIT_AMOUNT_INPUT; amountString: string }
  | { type: FijosMsgType.CONFIRM_APPLY_AMOUNT_ALL }
  | { type: FijosMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }
  | { type: FijosMsgType.CANCEL_AMOUNT_CONFIRMATION }
  | { type: FijosMsgType.CONFIRM_PARLET_AUTOFILL; numbers: number[] }
  | { type: FijosMsgType.CANCEL_PARLET_AUTOFILL }
  | { type: FijosMsgType.KEY_PRESSED; key: string }
  | { type: FijosMsgType.CONFIRM_INPUT };

export type FijosFeatMsg = { type: 'FIJOS'; payload: FijosMsg };

export const FijosCmd = {
  OPEN_BET_KEYBOARD: (): FijosFeatMsg => createMsg({ type: FijosMsgType.OPEN_BET_KEYBOARD }),
  CLOSE_BET_KEYBOARD: () => createMsg({ type: FijosMsgType.CLOSE_BET_KEYBOARD }),
  OPEN_AMOUNT_KEYBOARD: (betId: string, amountType: 'fijo' | 'corrido') => createMsg({ type: FijosMsgType.OPEN_AMOUNT_KEYBOARD, betId, amountType }),
  CLOSE_AMOUNT_KEYBOARD: () => createMsg({ type: FijosMsgType.CLOSE_AMOUNT_KEYBOARD }),
  PROCESS_BET_INPUT: (inputString: string) => createMsg({ type: FijosMsgType.PROCESS_BET_INPUT, inputString }),
  SUBMIT_AMOUNT_INPUT: (amountString: string) => createMsg({ type: FijosMsgType.SUBMIT_AMOUNT_INPUT, amountString }),
  CONFIRM_APPLY_AMOUNT_ALL: () => createMsg({ type: FijosMsgType.CONFIRM_APPLY_AMOUNT_ALL }),
  CONFIRM_APPLY_AMOUNT_SINGLE: () => createMsg({ type: FijosMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }),
  CANCEL_AMOUNT_CONFIRMATION: () => createMsg({ type: FijosMsgType.CANCEL_AMOUNT_CONFIRMATION }),
  KEY_PRESSED: (key: string) => createMsg({ type: FijosMsgType.KEY_PRESSED, key }),
  CONFIRM_INPUT: () => createMsg({ type: FijosMsgType.CONFIRM_INPUT }),



};

