import { createMsg } from '@/shared/core/msg';
import { ParletBet } from '@/types';
import { FijosCorridosBet } from '@/types';

export const PARLET_EDITING_TYPE = 'parlet';

// ============================================================================
// Parlet Feature Message
// ============================================================================

export const PARLET = createMsg<'PARLET', ParletMsg>('PARLET');
export type ParletFeatMsg = typeof PARLET._type;

// Helper function for ParletFeatMsg
export const parlet = (payload: ParletMsg) => PARLET(payload);

// ============================================================================
// Parlet Messages
// ============================================================================

export const PRESS_ADD_PARLET = createMsg<'PRESS_ADD_PARLET', { fijosCorridosList: FijosCorridosBet[] }>('PRESS_ADD_PARLET');
export const CONFIRM_PARLET_BET = createMsg<'CONFIRM_PARLET_BET', void>('CONFIRM_PARLET_BET');
export const CANCEL_PARLET_BET = createMsg<'CANCEL_PARLET_BET', void>('CANCEL_PARLET_BET');
export const EDIT_PARLET_BET = createMsg<'EDIT_PARLET_BET', { betId: string }>('EDIT_PARLET_BET');
export const DELETE_PARLET_BET = createMsg<'DELETE_PARLET_BET', { betId: string }>('DELETE_PARLET_BET');
export const UPDATE_PARLET_BET = createMsg<'UPDATE_PARLET_BET', { betId: string; changes: Partial<ParletBet> }>('UPDATE_PARLET_BET');
export const OPEN_PARLET_AMOUNT_KEYBOARD = createMsg<'OPEN_PARLET_AMOUNT_KEYBOARD', { betId: string }>('OPEN_PARLET_AMOUNT_KEYBOARD');
export const SHOW_PARLET_DRAWER = createMsg<'SHOW_PARLET_DRAWER', { visible: boolean }>('SHOW_PARLET_DRAWER');
export const SHOW_PARLET_MODAL = createMsg<'SHOW_PARLET_MODAL', { visible: boolean }>('SHOW_PARLET_MODAL');
export const SHOW_PARLET_ALERT = createMsg<'SHOW_PARLET_ALERT', { visible: boolean }>('SHOW_PARLET_ALERT');
export const PROCESS_BET_INPUT = createMsg<'PROCESS_BET_INPUT', { inputString: string }>('PROCESS_BET_INPUT');
export const SUBMIT_AMOUNT_INPUT = createMsg<'SUBMIT_AMOUNT_INPUT', { amountString: string }>('SUBMIT_AMOUNT_INPUT');
export const KEY_PRESSED = createMsg<'KEY_PRESSED', { key: string }>('KEY_PRESSED');
export const CONFIRM_INPUT = createMsg<'CONFIRM_INPUT', void>('CONFIRM_INPUT');
export const CLOSE_AMOUNT_KEYBOARD = createMsg<'CLOSE_AMOUNT_KEYBOARD', void>('CLOSE_AMOUNT_KEYBOARD');
export const CLOSE_BET_KEYBOARD = createMsg<'CLOSE_BET_KEYBOARD', void>('CLOSE_BET_KEYBOARD');

// ============================================================================
// Union Type
// ============================================================================

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
    | typeof PROCESS_BET_INPUT._type
    | typeof SUBMIT_AMOUNT_INPUT._type
    | typeof KEY_PRESSED._type
    | typeof CONFIRM_INPUT._type
    | typeof CLOSE_AMOUNT_KEYBOARD._type
    | typeof CLOSE_BET_KEYBOARD._type;

// ============================================================================
// Helper Functions for Messages (Compatibility)
// ============================================================================

export const pressAddParlet = (fijosCorridosList: FijosCorridosBet[]) => PRESS_ADD_PARLET({ fijosCorridosList });
export const confirmParletBet = CONFIRM_PARLET_BET;
export const cancelParletBet = CANCEL_PARLET_BET;
export const editParletBet = (betId: string) => EDIT_PARLET_BET({ betId });
export const deleteParletBet = (betId: string) => DELETE_PARLET_BET({ betId });
export const updateParletBet = (betId: string, changes: Partial<ParletBet>) => UPDATE_PARLET_BET({ betId, changes });
export const openParletAmountKeyboard = (betId: string) => OPEN_PARLET_AMOUNT_KEYBOARD({ betId });
export const showParletDrawer = (visible: boolean) => SHOW_PARLET_DRAWER({ visible });
export const showParletModal = (visible: boolean) => SHOW_PARLET_MODAL({ visible });
export const showParletAlert = (visible: boolean) => SHOW_PARLET_ALERT({ visible });
export const processBetInput = (inputString: string) => PROCESS_BET_INPUT({ inputString });
export const submitAmountInput = (amountString: string) => SUBMIT_AMOUNT_INPUT({ amountString });
export const keyPressed = (key: string) => KEY_PRESSED({ key });
export const confirmInput = CONFIRM_INPUT;
export const closeAmountKeyboard = CLOSE_AMOUNT_KEYBOARD;
export const closeBetKeyboard = CLOSE_BET_KEYBOARD;

export interface Model {
    potentialParletNumbers: number[];
    fromFijosyCorridoBet: boolean;
    parletAlertVisibleState: boolean;
    activeParletBetId: string | null;
    bulkEditingBetIds: string[]; // Track multiple bets created in a single expansion
    isParletDrawerVisible: boolean;
    isParletModalVisible: boolean;
    canceledFromFijosyCorridoBet?: boolean;
    usedFijosCombinations: string[];
}

export const initialParletState: Model = {
    potentialParletNumbers: [],
    fromFijosyCorridoBet: false,
    parletAlertVisibleState: false,
    activeParletBetId: null,
    bulkEditingBetIds: [],
    isParletDrawerVisible: false,
    isParletModalVisible: false,
    canceledFromFijosyCorridoBet: false,
    usedFijosCombinations: [],
};
