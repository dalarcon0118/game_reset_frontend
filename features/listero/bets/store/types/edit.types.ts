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
