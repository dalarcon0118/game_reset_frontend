import React from 'react';
import BottomDrawer from '@/components/ui/bottom_drawer';
import { BetNumericKeyboard, AmountNumericKeyboard } from '@/shared/components/bets/numeric_keyboard';

import { BET_TYPE_KEYS } from '@/shared/types/bet_types';

type BetType = typeof BET_TYPE_KEYS.FIJO_CORRIDO | typeof BET_TYPE_KEYS.PARLET | typeof BET_TYPE_KEYS.CENTENA | typeof BET_TYPE_KEYS.LOTERIA;

interface BetDrawerKeyboardProps {
    /** Controls the visibility of the drawer */
    isVisible: boolean;
    /** Callback when the drawer requests to close */
    onClose: () => void;
    /** Whether to show the Bet keyboard (true) or Amount keyboard (false) */
    showBetKeyboard: boolean;
    /** The current input value to display */
    currentInput: string;
    /** Callback when a key is pressed */
    onKeyPress: (key: string) => void;
    /** Callback when the confirm button is pressed */
    onConfirm: () => void;
    /** The type of bet for formatting logic (default: 'fijo-corrido') */
    betType?: BetType;
    /** Optional custom format for the bet (e.g., 'X-XX-XX') */
    betFormat?: string;
    /** Title of the drawer (optional) */
    title?: string;
    /** Height of the drawer (default: "60%") */
    height?: string | number;
}

/**
 * A reusable component that wraps the Bet/Amount numeric keyboards in a BottomDrawer.
 * This ensures consistent behavior and styling across different betting features.
 */
export const BetDrawerKeyboard: React.FC<BetDrawerKeyboardProps> = ({
    isVisible,
    onClose,
    showBetKeyboard,
    currentInput,
    onKeyPress,
    onConfirm,
    betType = BET_TYPE_KEYS.FIJO_CORRIDO,
    betFormat,
    title = '',
    height = '60%'
}) => {
    return (
        <BottomDrawer
            isVisible={isVisible}
            onClose={onClose}
            height={height}
            title={title}
        >
            {showBetKeyboard ? (
                <BetNumericKeyboard
                    betType={betType}
                    betFormat={betFormat}
                    currentInput={currentInput}
                    onKeyPress={onKeyPress}
                    onConfirm={onConfirm}
                />
            ) : (
                <AmountNumericKeyboard
                    currentInput={currentInput}
                    onKeyPress={onKeyPress}
                    onConfirm={onConfirm}
                />
            )}
        </BottomDrawer>
    );
};
