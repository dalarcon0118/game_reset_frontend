import { useCallback, useMemo } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '@/features/listero/bets/core/store';
import { LoteriaMsgType } from './loteria.types';
import { getFixedAmountFromRules, filterRulesByBetType } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('USE_LOTERIA_HOOK');

export const useLoteria = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { loteriaSession, editSession, listSession, managementSession, rules, isEditing, entrySession } = model;

    const drawDetails = managementSession.drawDetails.type === 'Success'
        ? managementSession.drawDetails.data
        : null;

    const loteriaList = isEditing
        ? entrySession.loteria
        : (listSession.remoteData.type === 'Success'
            ? listSession.remoteData.data.loteria
            : []);

    const fixedAmount = useMemo(() => {
        const loteriaBetTypeId = managementSession.betTypes.loteria;
        const validationRules = rules.data?.validation_rules || [];

        log.debug('Session details', {
            allBetTypes: managementSession.betTypes,
            loteriaBetTypeId,
            rulesCount: validationRules.length,
            availableBetTypesInRules: validationRules.map(r => ({ name: r.name, bet_types: r.bet_types }))
        });

        const betTypeRules = loteriaBetTypeId
            ? filterRulesByBetType(validationRules, loteriaBetTypeId)
            : validationRules.filter(r => {
                const name = (r.name || '').toUpperCase();
                return name.includes('LOTERIA') ||
                    name.includes('LOTERÍA') ||
                    name.includes('CUATERNA');
            });

        log.debug('Filtered Rules for Loteria', {
            count: betTypeRules.length,
            filteredBy: loteriaBetTypeId ? 'ID' : 'Name fallback'
        });

        const amount = getFixedAmountFromRules(betTypeRules);
        log.debug('Final Fixed Amount', { amount });

        return amount;
    }, [managementSession.betTypes.loteria, rules.data?.validation_rules]);

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

    const editLoteriaBet = useCallback((betId: string) =>
        dispatch({ type: 'LOTERIA', payload: { type: LoteriaMsgType.EDIT_LOTERIA_BET, betId } }),
        [dispatch]);

    return {
        loteriaList,
        fixedAmount,
        isBetKeyboardVisible: loteriaSession.isBetKeyboardVisible,
        isAmountKeyboardVisible: loteriaSession.isAmountKeyboardVisible,
        currentInput: editSession.currentInput,
        openBetKeyboard,
        closeBetKeyboard,
        openAmountKeyboard,
        closeAmountKeyboard,
        handleKeyPress,
        handleConfirmInput,
        editLoteriaBet,
        drawDetails,
    };
};
