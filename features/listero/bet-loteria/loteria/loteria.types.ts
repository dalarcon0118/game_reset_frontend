import { createMsg } from '@/shared/core/tea-utils';

// ============================================================================
// Message Constructors
// ============================================================================

export const OPEN_BET_KEYBOARD = createMsg<'OPEN_BET_KEYBOARD'>('OPEN_BET_KEYBOARD');
export const CLOSE_BET_KEYBOARD = createMsg<'CLOSE_BET_KEYBOARD'>('CLOSE_BET_KEYBOARD');
export const OPEN_AMOUNT_KEYBOARD = createMsg<'OPEN_AMOUNT_KEYBOARD', { betId: string }>('OPEN_AMOUNT_KEYBOARD');
export const CLOSE_AMOUNT_KEYBOARD = createMsg<'CLOSE_AMOUNT_KEYBOARD'>('CLOSE_AMOUNT_KEYBOARD');
export const KEY_PRESSED = createMsg<'KEY_PRESSED', { key: string }>('KEY_PRESSED');
export const CONFIRM_INPUT = createMsg<'CONFIRM_INPUT'>('CONFIRM_INPUT');
export const PROCESS_BET_INPUT = createMsg<'PROCESS_BET_INPUT', { input: string }>('PROCESS_BET_INPUT');
export const SUBMIT_AMOUNT_INPUT = createMsg<'SUBMIT_AMOUNT_INPUT', { amount: string }>('SUBMIT_AMOUNT_INPUT');
export const EDIT_LOTERIA_BET = createMsg<'EDIT_LOTERIA_BET', { betId: string }>('EDIT_LOTERIA_BET');
export const REQUEST_SAVE = createMsg<'REQUEST_SAVE', { drawId: string }>('REQUEST_SAVE');
export const INIT = createMsg<'INIT', { drawId: string; isEditing?: boolean; structureId?: string }>('INIT');
export const REFRESH_BETS = createMsg<'REFRESH_BETS', { drawId: string }>('REFRESH_BETS');
export const CONFIRM_SAVE_BETS = createMsg<'CONFIRM_SAVE_BETS', { drawId: string }>('CONFIRM_SAVE_BETS');
export const SAVE_BETS_RESPONSE = createMsg<'SAVE_BETS_RESPONSE', { response: any }>('SAVE_BETS_RESPONSE');
export const SAVE_SUCCESS = createMsg<'SAVE_SUCCESS'>('SAVE_SUCCESS');
export const SAVE_FAILURE = createMsg<'SAVE_FAILURE', { error: string }>('SAVE_FAILURE');

// Log types for debugging
console.log('Loteria Message Constructors Initialized:', {
    OPEN_BET_KEYBOARD: !!OPEN_BET_KEYBOARD,
    CLOSE_BET_KEYBOARD: !!CLOSE_BET_KEYBOARD,
    OPEN_AMOUNT_KEYBOARD: !!OPEN_AMOUNT_KEYBOARD,
    CLOSE_AMOUNT_KEYBOARD: !!CLOSE_AMOUNT_KEYBOARD,
    KEY_PRESSED: !!KEY_PRESSED,
    CONFIRM_INPUT: !!CONFIRM_INPUT,
    PROCESS_BET_INPUT: !!PROCESS_BET_INPUT,
    SUBMIT_AMOUNT_INPUT: !!SUBMIT_AMOUNT_INPUT,
    EDIT_LOTERIA_BET: !!EDIT_LOTERIA_BET,
    REQUEST_SAVE: !!REQUEST_SAVE,
    INIT: !!INIT,
    REFRESH_BETS: !!REFRESH_BETS,
    CONFIRM_SAVE_BETS: !!CONFIRM_SAVE_BETS,
    SAVE_BETS_RESPONSE: !!SAVE_BETS_RESPONSE,
    SAVE_SUCCESS: !!SAVE_SUCCESS,
    SAVE_FAILURE: !!SAVE_FAILURE
});

// ============================================================================
// Union Type
// ============================================================================

export type LoteriaMsg =
    | typeof OPEN_BET_KEYBOARD._type
    | typeof CLOSE_BET_KEYBOARD._type
    | typeof OPEN_AMOUNT_KEYBOARD._type
    | typeof CLOSE_AMOUNT_KEYBOARD._type
    | typeof KEY_PRESSED._type
    | typeof CONFIRM_INPUT._type
    | typeof PROCESS_BET_INPUT._type
    | typeof SUBMIT_AMOUNT_INPUT._type
    | typeof EDIT_LOTERIA_BET._type
    | typeof REQUEST_SAVE._type
    | typeof INIT._type
    | typeof REFRESH_BETS._type
    | typeof CONFIRM_SAVE_BETS._type
    | typeof SAVE_BETS_RESPONSE._type
    | typeof SAVE_SUCCESS._type
    | typeof SAVE_FAILURE._type;

// ============================================================================
// State
// ============================================================================

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
export const LoteriaFeatMsg = createMsg<'LOTERIA', LoteriaMsg>('LOTERIA');
export type LoteriaFeatMsg = typeof LoteriaFeatMsg._type;
