import React from 'react';
import { useBolitaStore, selectBolitaModel, selectDispatch } from '../store';
import { 
    FIJOS, 
    PARLET, 
    CENTENA, 
    CLOSE_BET_KEYBOARD, 
    CLOSE_AMOUNT_KEYBOARD, 
    CLOSE_PARLET_BET_KEYBOARD,
    CLOSE_PARLET_AMOUNT_KEYBOARD,
    CLOSE_CENTENA_BET_KEYBOARD,
    CLOSE_CENTENA_AMOUNT_KEYBOARD,
    KEY_PRESSED
} from '../../domain/models/bolita.messages';
import { BetNumericKeyboard, AmountNumericKeyboard } from '@/shared/components/bets/numeric_keyboard';
import BottomDrawer from '@/components/ui/bottom_drawer';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BOLITA_KEYBOARD_MANAGER');

/**
 * 🎹 BOLITA KEYBOARD MANAGER
 * 
 * Componente centralizado para la gestión de teclados de Bolita.
 * Cumple con SRP al encapsular la lógica de visualización y cierre.
 * Actúa como SSOT para la interacción con los teclados numéricos.
 */
export const BolitaKeyboardManager: React.FC = () => {
    const model = useBolitaStore(selectBolitaModel);
    const dispatch = useBolitaStore(selectDispatch);

    const { 
        showBetKeyboard, 
        showAmountKeyboard, 
        activeOwner, 
        currentInput 
    } = model.editState;

    const isVisible = showBetKeyboard || showAmountKeyboard;

    if (!isVisible || !activeOwner) {
        if (isVisible && !activeOwner) {
            log.warn('Intento de renderizado de teclado sin activeOwner', { 
                showBetKeyboard, 
                showAmountKeyboard 
            });
        }
        return null;
    }

    const onClose = () => {
        log.info('Cerrando teclado contextualmente', { activeOwner, showBetKeyboard, showAmountKeyboard });
        
        if (activeOwner === 'fijos') {
            if (showBetKeyboard) dispatch(FIJOS(CLOSE_BET_KEYBOARD()));
            if (showAmountKeyboard) dispatch(FIJOS(CLOSE_AMOUNT_KEYBOARD()));
        } else if (activeOwner === 'parlet') {
            if (showBetKeyboard) dispatch(PARLET(CLOSE_PARLET_BET_KEYBOARD()));
            if (showAmountKeyboard) dispatch(PARLET(CLOSE_PARLET_AMOUNT_KEYBOARD()));
        } else if (activeOwner === 'centena') {
            if (showBetKeyboard) dispatch(CENTENA(CLOSE_CENTENA_BET_KEYBOARD()));
            if (showAmountKeyboard) dispatch(CENTENA(CLOSE_CENTENA_AMOUNT_KEYBOARD()));
        }
    };

    const handleConfirm = () => {
        dispatch(KEY_PRESSED({ key: 'confirm' }));
    };

    const handleKeyPress = (key: string) => {
        dispatch(KEY_PRESSED({ key }));
    };

    const getBetTypeKey = () => {
        if (activeOwner === 'fijos') return BET_TYPE_KEYS.FIJO_CORRIDO;
        if (activeOwner === 'centena') return BET_TYPE_KEYS.CENTENA;
        return undefined;
    };

    return (
        <BottomDrawer isVisible={isVisible} onClose={onClose} title='' height={"60%"}>
            {showBetKeyboard ? (
                <BetNumericKeyboard
                    onKeyPress={handleKeyPress}
                    onConfirm={handleConfirm}
                    currentInput={currentInput}
                    betType={getBetTypeKey()}
                />
            ) : (
                <AmountNumericKeyboard
                    onKeyPress={handleKeyPress}
                    onConfirm={handleConfirm}
                    currentInput={currentInput}
                />
            )}
        </BottomDrawer>
    );
};
