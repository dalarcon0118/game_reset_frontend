import { LoteriaBet } from '@/types';

export enum LoteriaMsgType {
    OPEN_BET_KEYBOARD = 'OPEN_BET_KEYBOARD',
    CLOSE_BET_KEYBOARD = 'CLOSE_BET_KEYBOARD',
    OPEN_AMOUNT_KEYBOARD = 'OPEN_AMOUNT_KEYBOARD',
    CLOSE_AMOUNT_KEYBOARD = 'CLOSE_AMOUNT_KEYBOARD',
    KEY_PRESSED = 'KEY_PRESSED',
    CONFIRM_INPUT = 'CONFIRM_INPUT',
    PROCESS_BET_INPUT = 'PROCESS_BET_INPUT',
    SUBMIT_AMOUNT_INPUT = 'SUBMIT_AMOUNT_INPUT',
}

export type LoteriaMsg =
    | { type: LoteriaMsgType.OPEN_BET_KEYBOARD }
    | { type: LoteriaMsgType.CLOSE_BET_KEYBOARD }
    | { type: LoteriaMsgType.OPEN_AMOUNT_KEYBOARD; betId: string }
    | { type: LoteriaMsgType.CLOSE_AMOUNT_KEYBOARD }
    | { type: LoteriaMsgType.KEY_PRESSED; key: string }
    | { type: LoteriaMsgType.CONFIRM_INPUT }
    | { type: LoteriaMsgType.PROCESS_BET_INPUT; input: string }
    | { type: LoteriaMsgType.SUBMIT_AMOUNT_INPUT; amount: string };

export interface LoteriaState {
    isBetKeyboardVisible: boolean;
    isAmountKeyboardVisible: boolean;
    editingBetId: string | null;
}

export const initialLoteriaState: LoteriaState = {
    isBetKeyboardVisible: false,
    isAmountKeyboardVisible: false,
    editingBetId: null,
};

export type LoteriaFeatMsg = { type: 'LOTERIA'; payload: LoteriaMsg };
