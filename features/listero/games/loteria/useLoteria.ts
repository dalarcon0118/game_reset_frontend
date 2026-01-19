import { useCallback } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '@/features/listero/bets/core/store';
import { LoteriaMsgType } from './loteria.types';

export const useLoteria = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { loteriaSession, editSession, listSession } = model;
    
    const loteriaList = listSession.remoteData.type === 'Success' 
        ? listSession.remoteData.data.loteria 
        : [];

    const openBetKeyboard = useCallback(() => 
        dispatch({ type: 'LOTERIA', payload: { type: LoteriaMsgType.OPEN_BET_KEYBOARD } }), 
    [dispatch]);

    const closeBetKeyboard = useCallback(() => 
        dispatch({ type: 'LOTERIA', payload: { type: LoteriaMsgType.CLOSE_BET_KEYBOARD } }), 
    [dispatch]);

    const openAmountKeyboard = useCallback((betId: string) => 
        dispatch({ type: 'LOTERIA', payload: { type: LoteriaMsgType.OPEN_AMOUNT_KEYBOARD, betId } }), 
    [dispatch]);

    const closeAmountKeyboard = useCallback(() => 
        dispatch({ type: 'LOTERIA', payload: { type: LoteriaMsgType.CLOSE_AMOUNT_KEYBOARD } }), 
    [dispatch]);

    const handleKeyPress = useCallback((key: string) => 
        dispatch({ type: 'LOTERIA', payload: { type: LoteriaMsgType.KEY_PRESSED, key } }), 
    [dispatch]);

    const handleConfirmInput = useCallback(() => 
        dispatch({ type: 'LOTERIA', payload: { type: LoteriaMsgType.CONFIRM_INPUT } }), 
    [dispatch]);

    return {
        loteriaList,
        isBetKeyboardVisible: loteriaSession.isBetKeyboardVisible,
        isAmountKeyboardVisible: loteriaSession.isAmountKeyboardVisible,
        currentInput: editSession.currentInput,
        openBetKeyboard,
        closeBetKeyboard,
        openAmountKeyboard,
        closeAmountKeyboard,
        handleKeyPress,
        handleConfirmInput,
    };
};
