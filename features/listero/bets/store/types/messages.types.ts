import { FijosCorridosBet, ParletBet, CentenaBet, GameType, WinningRecord } from '../../../../types';
import { UnifiedRulesResponse } from '../../../../shared/services/rules';

export enum MsgType {
    FETCH_BET_TYPES_REQUESTED = 'FETCH_BET_TYPES_REQUESTED',
    FETCH_BET_TYPES_SUCCEEDED = 'FETCH_BET_TYPES_SUCCEEDED',
    FETCH_BET_TYPES_FAILED = 'FETCH_BET_TYPES_FAILED',

    UPDATE_FIJOS_CORRIDOS = 'UPDATE_FIJOS_CORRIDOS',
    UPDATE_PARLETS = 'UPDATE_PARLETS',
    UPDATE_CENTENAS = 'UPDATE_CENTENAS',

    SAVE_BETS_REQUESTED = 'SAVE_BETS_REQUESTED',
    SAVE_BETS_SUCCEEDED = 'SAVE_BETS_SUCCEEDED',
    SAVE_BETS_FAILED = 'SAVE_BETS_FAILED',

    RESET_BETS = 'RESET_BETS',

    // UI Keyboard and Buffer messages
    OPEN_BET_KEYBOARD = 'OPEN_BET_KEYBOARD',
    CLOSE_BET_KEYBOARD = 'CLOSE_BET_KEYBOARD',
    OPEN_AMOUNT_KEYBOARD = 'OPEN_AMOUNT_KEYBOARD',
    CLOSE_AMOUNT_KEYBOARD = 'CLOSE_AMOUNT_KEYBOARD',

    PROCESS_BET_INPUT = 'PROCESS_BET_INPUT',
    SUBMIT_AMOUNT_INPUT = 'SUBMIT_AMOUNT_INPUT',

    CONFIRM_APPLY_AMOUNT_ALL = 'CONFIRM_APPLY_AMOUNT_ALL',
    CONFIRM_APPLY_AMOUNT_SINGLE = 'CONFIRM_APPLY_AMOUNT_SINGLE',
    CANCEL_AMOUNT_CONFIRMATION = 'CANCEL_AMOUNT_CONFIRMATION',

    // Parlet specific messages
    PRESS_ADD_PARLET = 'PRESS_ADD_PARLET',
    CONFIRM_PARLET_BET = 'CONFIRM_PARLET_BET',
    CANCEL_PARLET_BET = 'CANCEL_PARLET_BET',
    EDIT_PARLET_BET = 'EDIT_PARLET_BET',
    DELETE_PARLET_BET = 'DELETE_PARLET_BET',
    UPDATE_PARLET_BET = 'UPDATE_PARLET_BET',
    OPEN_PARLET_AMOUNT_KEYBOARD = 'OPEN_PARLET_AMOUNT_KEYBOARD',
    SHOW_PARLET_DRAWER = 'SHOW_PARLET_DRAWER',
    SHOW_PARLET_MODAL = 'SHOW_PARLET_MODAL',
    SHOW_PARLET_ALERT = 'SHOW_PARLET_ALERT',
    CLOSE_ALL_DRAWERS = 'CLOSE_ALL_DRAWERS',

    // List View Messages
    FETCH_BETS_REQUESTED = 'FETCH_BETS_REQUESTED',
    FETCH_BETS_SUCCEEDED = 'FETCH_BETS_SUCCEEDED',
    FETCH_BETS_FAILED = 'FETCH_BETS_FAILED',

    // Create Bet View Messages
    SET_CREATE_DRAW = 'SET_CREATE_DRAW',
    SET_CREATE_GAME_TYPE = 'SET_CREATE_GAME_TYPE',
    UPDATE_CREATE_NUMBERS = 'UPDATE_CREATE_NUMBERS',
    UPDATE_CREATE_AMOUNT = 'UPDATE_CREATE_AMOUNT',
    ADD_BET_TO_CREATE_LIST = 'ADD_BET_TO_CREATE_LIST',
    REMOVE_BET_FROM_CREATE_LIST = 'REMOVE_BET_FROM_CREATE_LIST',
    CLEAR_CREATE_SESSION = 'CLEAR_CREATE_SESSION',

    // Common UI messages
    SET_ACTIVE_ANNOTATION_TYPE = 'SET_ACTIVE_ANNOTATION_TYPE',
    SET_ACTIVE_GAME_TYPE = 'SET_ACTIVE_GAME_TYPE',
    CLEAR_ERROR = 'CLEAR_ERROR',

    // Bet Edit View Messages (Ranges)
    SET_EDIT_SELECTED_COLUMN = 'SET_EDIT_SELECTED_COLUMN',
    SET_EDIT_SELECTED_CIRCLE = 'SET_EDIT_SELECTED_CIRCLE',
    TOGGLE_RANGE_MODE = 'TOGGLE_RANGE_MODE',
    SET_RANGE_TYPE = 'SET_RANGE_TYPE',
    GENERATE_RANGE_BETS = 'GENERATE_RANGE_BETS',
    UPDATE_EDIT_INPUT = 'UPDATE_EDIT_INPUT',

    // Rewards & Rules Messages
    FETCH_REWARDS_REQUESTED = 'FETCH_REWARDS_REQUESTED',
    FETCH_REWARDS_SUCCEEDED = 'FETCH_REWARDS_SUCCEEDED',
    FETCH_REWARDS_FAILED = 'FETCH_REWARDS_FAILED',
    FETCH_RULES_REQUESTED = 'FETCH_RULES_REQUESTED',
    FETCH_RULES_SUCCEEDED = 'FETCH_RULES_SUCCEEDED',
    FETCH_RULES_FAILED = 'FETCH_RULES_FAILED',
}

export type Msg =
    | { type: MsgType.FETCH_BET_TYPES_REQUESTED; drawId: string }
    | { type: MsgType.FETCH_BET_TYPES_SUCCEEDED; betTypes: GameType[] }
    | { type: MsgType.FETCH_BET_TYPES_FAILED; error: string }
    | { type: MsgType.UPDATE_FIJOS_CORRIDOS; bets: FijosCorridosBet[] }
    | { type: MsgType.UPDATE_PARLETS; bets: ParletBet[] }
    | { type: MsgType.UPDATE_CENTENAS; bets: CentenaBet[] }
    | { type: MsgType.SAVE_BETS_REQUESTED; drawId: string }
    | { type: MsgType.SAVE_BETS_SUCCEEDED; response: any }
    | { type: MsgType.SAVE_BETS_FAILED; error: string }
    | { type: MsgType.RESET_BETS }
    | { type: MsgType.OPEN_BET_KEYBOARD }
    | { type: MsgType.CLOSE_BET_KEYBOARD }
    | { type: MsgType.OPEN_AMOUNT_KEYBOARD; betId: string; amountType: 'fijo' | 'corrido' }
    | { type: MsgType.CLOSE_AMOUNT_KEYBOARD }
    | { type: MsgType.PROCESS_BET_INPUT; inputString: string }
    | { type: MsgType.SUBMIT_AMOUNT_INPUT; amountString: string }
    | { type: MsgType.CONFIRM_APPLY_AMOUNT_ALL }
    | { type: MsgType.CONFIRM_APPLY_AMOUNT_SINGLE }
    | { type: MsgType.CANCEL_AMOUNT_CONFIRMATION }
    | { type: MsgType.PRESS_ADD_PARLET; fijosCorridosList: FijosCorridosBet[] }
    | { type: MsgType.CONFIRM_PARLET_BET }
    | { type: MsgType.CANCEL_PARLET_BET }
    | { type: MsgType.EDIT_PARLET_BET; betId: string }
    | { type: MsgType.DELETE_PARLET_BET; betId: string }
    | { type: MsgType.UPDATE_PARLET_BET; betId: string; changes: Partial<ParletBet> }
    | { type: MsgType.OPEN_PARLET_AMOUNT_KEYBOARD; betId: string }
    | { type: MsgType.SHOW_PARLET_DRAWER; visible: boolean }
    | { type: MsgType.SHOW_PARLET_MODAL; visible: boolean }
    | { type: MsgType.SHOW_PARLET_ALERT; visible: boolean }
    | { type: MsgType.CLOSE_ALL_DRAWERS }
    | { type: MsgType.SET_ACTIVE_ANNOTATION_TYPE; annotationType: string | null }
    | { type: MsgType.SET_ACTIVE_GAME_TYPE; gameType: string | null }
    | { type: MsgType.CLEAR_ERROR }
    // List
    | { type: MsgType.FETCH_BETS_REQUESTED; drawId: string }
    | { type: MsgType.FETCH_BETS_SUCCEEDED; fijosCorridos: FijosCorridosBet[]; parlets: ParletBet[]; centenas: CentenaBet[] }
    | { type: MsgType.FETCH_BETS_FAILED; error: string }
    // Create
    | { type: MsgType.SET_CREATE_DRAW; drawId: string }
    | { type: MsgType.SET_CREATE_GAME_TYPE; gameType: GameType }
    | { type: MsgType.UPDATE_CREATE_NUMBERS; numbers: string }
    | { type: MsgType.UPDATE_CREATE_AMOUNT; amount: string }
    | { type: MsgType.ADD_BET_TO_CREATE_LIST }
    | { type: MsgType.REMOVE_BET_FROM_CREATE_LIST; index: number }
    | { type: MsgType.CLEAR_CREATE_SESSION }
    // Edit
    | { type: MsgType.SET_EDIT_SELECTED_COLUMN; column: string | null }
    | { type: MsgType.SET_EDIT_SELECTED_CIRCLE; circle: number | null }
    | { type: MsgType.TOGGLE_RANGE_MODE; enabled: boolean }
    | { type: MsgType.SET_RANGE_TYPE; rangeType: 'continuous' | 'terminal' | null }
    | { type: MsgType.GENERATE_RANGE_BETS; start: string; end: string }
    | { type: MsgType.UPDATE_EDIT_INPUT; value: string }
    // Rewards & Rules
    | { type: MsgType.FETCH_REWARDS_REQUESTED; drawId: string }
    | { type: MsgType.FETCH_REWARDS_SUCCEEDED; rewards: WinningRecord | null }
    | { type: MsgType.FETCH_REWARDS_FAILED; error: any }
    | { type: MsgType.FETCH_RULES_REQUESTED; drawId: string }
    | { type: MsgType.FETCH_RULES_SUCCEEDED; rules: UnifiedRulesResponse | null }
    | { type: MsgType.FETCH_RULES_FAILED; error: any };
