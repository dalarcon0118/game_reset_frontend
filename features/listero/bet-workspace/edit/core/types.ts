export interface Model {
    selectedColumn: string | null;
    selectedCircle: number | null;
    isRangeMode: boolean;
    rangeType: 'continuous' | 'terminal' | null;
    currentNumber: string;
    currentAmount: string;
    rangeStartNumber: string;
    showRangeDialog: boolean;
    rangeBets: number[];
    currentInput: string;

    // Keyboard and UI states
    showBetKeyboard: boolean;
    showAmountKeyboard: boolean;
    showParletKeyboard: boolean;
    betBuffer: number[];
    editingBetId: string | null;
    editingAmountType: 'fijo' | 'corrido' | 'parlet' | 'centena' | null;
    amountConfirmationDetails: {
        amountValue: number;
        intendedAmountType: 'fijo' | 'corrido' | 'parlet' | 'centena';
        intendedBetId: string | null;
    } | null;
}

export const initialEditState: Model = {
    selectedColumn: null,
    selectedCircle: null,
    isRangeMode: false,
    rangeType: null,
    currentNumber: '',
    currentAmount: '',
    rangeStartNumber: '',
    showRangeDialog: false,
    rangeBets: [],
    currentInput: '',
    showBetKeyboard: false,
    showAmountKeyboard: false,
    showParletKeyboard: false,
    betBuffer: [],
    editingBetId: null,
    editingAmountType: null,
    amountConfirmationDetails: null,
};

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

export type EditFeatMsg = { type: 'EDIT'; payload: EditMsg };
