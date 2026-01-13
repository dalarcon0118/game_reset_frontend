export enum KeyboardMsgType {
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

export type KeyboardMsg =
    | { type: KeyboardMsgType.OPEN_BET_KEYBOARD }
    | { type: KeyboardMsgType.CLOSE_BET_KEYBOARD }
    | { type: KeyboardMsgType.OPEN_AMOUNT_KEYBOARD; betId: string; amountType: 'fijo' | 'corrido' }
    | { type: KeyboardMsgType.CLOSE_AMOUNT_KEYBOARD }
    | { type: KeyboardMsgType.PROCESS_BET_INPUT; inputString: string }
    | { type: KeyboardMsgType.SUBMIT_AMOUNT_INPUT; amountString: string }
    | { type: KeyboardMsgType.CONFIRM_APPLY_AMOUNT_ALL }
    | { type: KeyboardMsgType.CONFIRM_APPLY_AMOUNT_SINGLE }
    | { type: KeyboardMsgType.CANCEL_AMOUNT_CONFIRMATION };
