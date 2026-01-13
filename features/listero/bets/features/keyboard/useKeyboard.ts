import { KeyboardMsg, KeyboardMsgType } from './keyboard.types';
import { useCallback } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';

export const useKeyboard = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const openBetKeyboard = useCallback(() => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.OPEN_BET_KEYBOARD } });
    }, [dispatch]);

    const closeBetKeyboard = useCallback(() => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.CLOSE_BET_KEYBOARD } });
    }, [dispatch]);

    const openAmountKeyboard = useCallback((betId: string, amountType: 'fijo' | 'corrido') => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.OPEN_AMOUNT_KEYBOARD, betId, amountType } });
    }, [dispatch]);

    const closeAmountKeyboard = useCallback(() => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.CLOSE_AMOUNT_KEYBOARD } });
    }, [dispatch]);

    const processBetInput = useCallback((inputString: string) => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.PROCESS_BET_INPUT, inputString } });
    }, [dispatch]);

    const submitAmountInput = useCallback((amountString: string) => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.SUBMIT_AMOUNT_INPUT, amountString } });
    }, [dispatch]);

    const confirmApplyAmountAll = useCallback(() => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.CONFIRM_APPLY_AMOUNT_ALL } });
    }, [dispatch]);

    const confirmApplyAmountSingle = useCallback(() => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.CONFIRM_APPLY_AMOUNT_SINGLE } });
    }, [dispatch]);

    const cancelAmountConfirmation = useCallback(() => {
        dispatch({ type: 'KEYBOARD', payload: { type: KeyboardMsgType.CANCEL_AMOUNT_CONFIRMATION } });
    }, [dispatch]);

    return {
        showBetKeyboard: model.editSession.showBetKeyboard,
        showAmountKeyboard: model.editSession.showAmountKeyboard,
        editingBetId: model.editSession.editingBetId,
        editingAmountType: model.editSession.editingAmountType,
        amountConfirmationDetails: model.editSession.amountConfirmationDetails,
        openBetKeyboard,
        closeBetKeyboard,
        openAmountKeyboard,
        closeAmountKeyboard,
        processBetInput,
        submitAmountInput,
        confirmApplyAmountAll,
        confirmApplyAmountSingle,
        cancelAmountConfirmation,
    };
};
