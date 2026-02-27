/**
 * ⌨️ INPUT LOGIC
 * Handles low-level input validation, normalization, and keyboard interactions.
 * This is pure string manipulation logic.
 */
export const InputLogic = {
    /**
     * Handles keyboard input based on current state and keyboard type.
     */
    handleKeyPress: (currentInput: string, key: string, isBetKeyboard: boolean): string => {
        const normalizedKey = key.toUpperCase();
        if (normalizedKey === 'BACKSPACE') return currentInput.slice(0, -1);
        if (normalizedKey === 'CLEAR') return '';

        const maxLength = isBetKeyboard ? 5 : 6;
        // Only allow digits for now
        if (currentInput.length < maxLength && /^\d+$/.test(key)) {
            return currentInput + key;
        }
        return currentInput;
    },

    /**
     * Validates if a bet input is complete/valid
     */
    isValidBet: (input: string): boolean => {
        return input.length === 5; // Lotería requiere exactamente 5 dígitos
    },

    /**
     * Parses amount string safely
     */
    parseAmount: (amountStr: string): number => {
        return parseInt(amountStr, 10) || 0;
    }
};
