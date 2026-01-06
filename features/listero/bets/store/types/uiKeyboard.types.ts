export enum UiKeyboardMsgType {
    OPEN_BET_KEYBOARD = 'OPEN_BET_KEYBOARD',
    CLOSE_BET_KEYBOARD = 'CLOSE_BET_KEYBOARD',
    OPEN_AMOUNT_KEYBOARD = 'OPEN_AMOUNT_KEYBOARD',
    CLOSE_AMOUNT_KEYBOARD = 'CLOSE_AMOUNT_KEYBOARD',
    PROCESS_BET_INPUT = 'PROCESS_BET_INPUT',
    SUBMIT_AMOUNT_INPUT = 'SUBMIT_AMOUNT_INPUT',
    CONFIRM_APPLY_AMOUNT_ALL = 'CONFIRM_APPLY_AMOUNT_ALL',
    CONFIRM_APPLY_AMOUNT_SINGLE = 'CONFIRM_APPLY_AMOUNT_SINGLE',
    CANCEL_AMOUNT_CONFIRMATION = 'CANCEL_AMOUNT_CONFIRMATION',
}

export type UiKeyboardMsg =
    | { type: UiKeyboardMsgType.OPEN_BET_KEYBOARD }
    | { type: UiKeyboardMsgType.CLOSE_BET_KEYBOARD }
    | { type: UiKeyboardMsgType.OPEN_AMOUNT_KEYBOARD; betId: string; amountType: 'fijo' | 'corrido' }
    | { type: UiKeyboardMsgType.CLOSE_AMOUNT_KEYBOARD }
    | { type: UiKeyboardMsgType.PROCESS_BET_INPUT; inputString: string }
    | { type: UiKeyboardMsgType.SUBMIT_AMOUNT_INPUT; amountString: string }
    | { type: UiKeyboardMsgType.CONFIRM_APPLY_AMOUNT_ALL }
    | { type: UiKeyboardMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }
    | { type: UiKeyboardMsgType.CANCEL_AMOUNT_CONFIRMATION };
