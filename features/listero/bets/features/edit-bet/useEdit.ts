import { useCallback } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { EditMsgType } from './edit.types';

export const useEdit = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { editSession } = model;
    const {
        selectedColumn, selectedCircle, isRangeMode, rangeType,
        currentNumber, currentAmount, rangeStartNumber, showRangeDialog, rangeBets,
        showBetKeyboard, showAmountKeyboard, editingBetId, editingAmountType, amountConfirmationDetails
    } = editSession;

    const setSelectedColumn = useCallback((column: string | null) => {
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_COLUMN, column } });
    }, [dispatch]);

    const setSelectedCircle = useCallback((circle: number | null) => {
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_CIRCLE, circle } });
    }, [dispatch]);

    const toggleRangeMode = useCallback((enabled: boolean) => {
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.TOGGLE_RANGE_MODE, enabled } });
    }, [dispatch]);

    const setRangeType = useCallback((rangeType: 'continuous' | 'terminal' | null) => {
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_RANGE_TYPE, rangeType } });
    }, [dispatch]);

    const generateRangeBets = useCallback((start: string, end: string) => {
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.GENERATE_RANGE_BETS, start, end } });
    }, [dispatch]);

    const updateEditInput = useCallback((value: string) => {
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.UPDATE_EDIT_INPUT, value } });
    }, [dispatch]);

    return {
        editSession,
        selectedColumn, selectedCircle, isRangeMode, rangeType,
        currentNumber, currentAmount, rangeStartNumber, showRangeDialog, rangeBets,
        showBetKeyboard, showAmountKeyboard, editingBetId, editingAmountType, amountConfirmationDetails,
        setSelectedColumn, setSelectedCircle, toggleRangeMode, setRangeType, generateRangeBets, updateEditInput,
    };
};
