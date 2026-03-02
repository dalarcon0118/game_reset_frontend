import { useCallback, useMemo } from 'react';
import { useLoteriaStore, selectDispatch } from './core/store';
import {
    LoteriaFeatMsg,
    OPEN_BET_KEYBOARD,
    CLOSE_BET_KEYBOARD,
    OPEN_AMOUNT_KEYBOARD,
    CLOSE_AMOUNT_KEYBOARD,
    KEY_PRESSED,
    CONFIRM_INPUT,
    PROCESS_BET_INPUT,
    SUBMIT_AMOUNT_INPUT,
    EDIT_LOTERIA_BET,
    REQUEST_SAVE,
    INIT,
    REFRESH_BETS
} from './loteria/loteria.types';

export const useLoteriaActions = () => {
    const dispatch = useLoteriaStore(selectDispatch);

    const init = useCallback((drawId: string, isEditing: boolean = true, structureId?: string) => {
        dispatch(LoteriaFeatMsg(INIT({ drawId, isEditing, structureId })));
    }, [dispatch]);

    const openBetKeyboard = useCallback(() =>
        dispatch(LoteriaFeatMsg(OPEN_BET_KEYBOARD())),
        [dispatch]);

    const closeBetKeyboard = useCallback(() =>
        dispatch(LoteriaFeatMsg(CLOSE_BET_KEYBOARD())),
        [dispatch]);

    const openAmountKeyboard = useCallback((betId: string) =>
        dispatch(LoteriaFeatMsg(OPEN_AMOUNT_KEYBOARD({ betId }))),
        [dispatch]);

    const closeAmountKeyboard = useCallback(() =>
        dispatch(LoteriaFeatMsg(CLOSE_AMOUNT_KEYBOARD())),
        [dispatch]);

    const handleKeyPress = useCallback((key: string) =>
        dispatch(LoteriaFeatMsg(KEY_PRESSED({ key }))),
        [dispatch]);

    const handleConfirmInput = useCallback(() =>
        dispatch(LoteriaFeatMsg(CONFIRM_INPUT())),
        [dispatch]);

    const processBetInput = useCallback((input: string) =>
        dispatch(LoteriaFeatMsg(PROCESS_BET_INPUT({ input }))),
        [dispatch]);

    const submitAmountInput = useCallback((amount: string) =>
        dispatch(LoteriaFeatMsg(SUBMIT_AMOUNT_INPUT({ amount }))),
        [dispatch]);

    const editLoteriaBet = useCallback((betId: string) =>
        dispatch(LoteriaFeatMsg(EDIT_LOTERIA_BET({ betId }))),
        [dispatch]);

    const requestSave = useCallback((drawId: string) =>
        dispatch(LoteriaFeatMsg(REQUEST_SAVE({ drawId }))),
        [dispatch]);

    const refreshBets = useCallback((drawId: string) => {
        dispatch(LoteriaFeatMsg(REFRESH_BETS({ drawId })));
    }, [dispatch]);

    return useMemo(() => ({
        init,
        openBetKeyboard,
        closeBetKeyboard,
        openAmountKeyboard,
        closeAmountKeyboard,
        handleKeyPress,
        handleConfirmInput,
        processBetInput,
        submitAmountInput,
        editLoteriaBet,
        requestSave,
        refreshBets,
    }), [
        init,
        openBetKeyboard,
        closeBetKeyboard,
        openAmountKeyboard,
        closeAmountKeyboard,
        handleKeyPress,
        handleConfirmInput,
        processBetInput,
        submitAmountInput,
        editLoteriaBet,
        requestSave,
        refreshBets
    ]);
};
