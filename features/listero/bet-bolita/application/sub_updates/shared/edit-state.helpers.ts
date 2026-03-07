import { BolitaModel } from '../../../domain/models/bolita.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BOLITA_EDIT_HELPERS');

/**
 * Limpia el estado de edición básico (inputs y teclados).
 */
export const clearEditState = (model: BolitaModel): BolitaModel => ({
    ...model,
    editState: {
        ...model.editState,
        showBetKeyboard: false,
        showAmountKeyboard: false,
        currentInput: '',
        editingBetId: null,
        editingAmountType: null,
    }
});

/**
 * Abre el teclado de apuestas para un dueño específico.
 */
export const openBetKeyboard = (
    model: BolitaModel,
    owner: BolitaModel['editState']['activeOwner'],
    betId: string | null = null
): BolitaModel => {
    log.debug('OPEN_BET_KEYBOARD', { owner, betId });
    return {
        ...model,
        isEditing: true,
        editState: {
            ...model.editState,
            activeOwner: owner,
            showBetKeyboard: true,
            editingBetId: betId,
            currentInput: ''
        }
    };
};

/**
 * Cierra el teclado de apuestas.
 */
export const closeBetKeyboard = (model: BolitaModel): BolitaModel => ({
    ...model,
    editState: {
        ...model.editState,
        showBetKeyboard: false,
        currentInput: ''
    }
});

/**
 * Abre el teclado de montos.
 */
export const openAmountKeyboard = (
    model: BolitaModel,
    owner: BolitaModel['editState']['activeOwner'],
    betId: string,
    amountType: string
): BolitaModel => {
    log.debug('OPEN_AMOUNT_KEYBOARD', { owner, betId, amountType });
    return {
        ...model,
        isEditing: true,
        editState: {
            ...model.editState,
            activeOwner: owner,
            showAmountKeyboard: true,
            editingBetId: betId,
            editingAmountType: amountType as any,
            currentInput: ''
        }
    };
};

/**
 * Cierra el teclado de montos.
 */
export const closeAmountKeyboard = (model: BolitaModel): BolitaModel => ({
    ...model,
    editState: {
        ...model.editState,
        showAmountKeyboard: false,
        editingBetId: null,
        editingAmountType: null,
        currentInput: ''
    }
});
