import { BolitaModel } from '../../../domain/models/bolita.types';
import { logger } from '@/shared/utils/logger';
import { BolitaImpl } from '../../../domain/bolita.impl';

const log = logger.withTag('BOLITA_AMOUNT_HELPERS');

/**
 * Recalcula el resumen del modelo.
 */
export const updateSummary = (model: BolitaModel): BolitaModel => ({
    ...model,
    summary: BolitaImpl.calculation.calculateSummary(model)
});

/**
 * Limpia los detalles de confirmación de monto.
 */
export const clearAmountConfirmation = (model: BolitaModel): BolitaModel => ({
    ...model,
    editState: {
        ...model.editState,
        amountConfirmationDetails: null,
        editingBetId: null,
        editingAmountType: null
    }
});

/**
 * Aplica un monto a una apuesta individual de fijos/corridos.
 */
export const applyAmountSingle = (model: BolitaModel): BolitaModel => {
    const { amountConfirmationDetails } = model.editState;
    if (!amountConfirmationDetails) return model;

    const { amountValue, intendedAmountType, intendedBetId } = amountConfirmationDetails;

    const updatedFijosCorridos = model.entrySession.fijosCorridos.map(b => {
        if (b.id === intendedBetId) {
            return {
                ...b,
                fijoAmount: intendedAmountType === 'fijo' ? amountValue : b.fijoAmount,
                corridoAmount: intendedAmountType === 'corrido' ? amountValue : b.corridoAmount,
            };
        }
        return b;
    });

    const modelWithBets = {
        ...model,
        entrySession: {
            ...model.entrySession,
            fijosCorridos: updatedFijosCorridos,
        }
    };

    return updateSummary(clearAmountConfirmation(modelWithBets));
};

/**
 * Aplica un monto a todas las apuestas de fijos/corridos.
 */
export const applyAmountAll = (model: BolitaModel): BolitaModel => {
    const { amountConfirmationDetails } = model.editState;
    if (!amountConfirmationDetails) return model;

    const { amountValue, intendedAmountType } = amountConfirmationDetails;

    // Solo aplicar a las apuestas actuales, SIN persistir el monto para futuras apuestas
    const updatedFijosCorridos = model.entrySession.fijosCorridos.map(b => ({
        ...b,
        fijoAmount: intendedAmountType === 'fijo' ? amountValue : b.fijoAmount,
        corridoAmount: intendedAmountType === 'corrido' ? amountValue : b.corridoAmount,
    }));

    log.info('applyAmountAll: Monto aplicado a todas las apuestas actuales');

    return updateSummary({
        ...model,
        entrySession: {
            ...model.entrySession,
            fijosCorridos: updatedFijosCorridos,
        },
        ...clearAmountConfirmation(model).editState
    });
};

/**
 * Prepara los detalles de confirmación de monto si aplica.
 */
export const prepareAmountConfirmation = (model: BolitaModel, amount: number): BolitaModel => {
    const { editingBetId, editingAmountType } = model.editState;
    if (!editingBetId || !editingAmountType) return model;

    return {
        ...model,
        editState: {
            ...model.editState,
            amountConfirmationDetails: {
                amountValue: amount,
                intendedAmountType: editingAmountType,
                intendedBetId: editingBetId
            }
        }
    };
};
