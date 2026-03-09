import React from 'react';
import { match, P } from 'ts-pattern';
import { useBolitaStore, selectBolitaModel, selectDispatch } from '../store';
import { 
    CLOSE_KEYBOARD,
    CONFIRM_INPUT,
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
        dispatch(CLOSE_KEYBOARD());
    };

    const handleConfirm = () => {
        dispatch(CONFIRM_INPUT());
    };

    const handleKeyPress = (key: string) => {
        dispatch(KEY_PRESSED({ key }));
    };

    const betType = match(activeOwner)
        .with('fijos', () => BET_TYPE_KEYS.FIJO_CORRIDO)
        .with('centena', () => BET_TYPE_KEYS.CENTENA)
        .otherwise(() => undefined);

    return (
        <BottomDrawer isVisible={isVisible} onClose={onClose} title='' height={"60%"}>
            {showBetKeyboard ? (
                <BetNumericKeyboard
                    onKeyPress={handleKeyPress}
                    onConfirm={handleConfirm}
                    currentInput={currentInput}
                    betType={betType}
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
