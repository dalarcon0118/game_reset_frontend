import { BolitaModel } from '../../../domain/models/bolita.types';
import { logger } from '@/shared/utils/logger';
import { BolitaImpl } from '../../../domain/bolita.impl';

const log = logger.withTag('BOLITA_AMOUNT_HELPERS');

/**
 * Recalcula el resumen del modelo.
 */
export const updateSummary = (model: BolitaModel): BolitaModel => ({
    ...model,
    summary: {
        ...model.summary,
        ...BolitaImpl.calculation.calculateSummary(model.entrySession)
    }
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
 * Aplica un monto a una apuesta individual de fijos/corridos o centenas.
 */
export const applyAmountSingle = (model: BolitaModel): BolitaModel => {
    const { amountConfirmationDetails } = model.editState;
    if (!amountConfirmationDetails) return model;

    const { amountValue, intendedAmountType, intendedBetId } = amountConfirmationDetails;

    // Actualizar fijos/corridos si aplica
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

    // Actualizar centenas si aplica
    const updatedCentenas = model.entrySession.centenas.map(c => {
        if (c.id === intendedBetId && intendedAmountType === 'centena') {
            return { ...c, amount: amountValue };
        }
        return c;
    });

    // Actualizar parlets si aplica
    const updatedParlets = model.entrySession.parlets.map(p => {
        if (p.id === intendedBetId && intendedAmountType === 'parlet') {
            return { ...p, amount: amountValue };
        }
        return p;
    });

    const modelWithBets = {
        ...model,
        entrySession: {
            ...model.entrySession,
            fijosCorridos: updatedFijosCorridos,
            centenas: updatedCentenas,
            parlets: updatedParlets,
        }
    };

    return updateSummary(clearAmountConfirmation(modelWithBets));
};

/**
 * Aplica un monto a todas las apuestas de fijos/corridos o centenas o parlets.
 */
export const applyAmountAll = (model: BolitaModel): BolitaModel => {
    const { amountConfirmationDetails } = model.editState;
    if (!amountConfirmationDetails) return model;

    const { amountValue, intendedAmountType } = amountConfirmationDetails;

    // Actualizar fijos/corridos si aplica
    const updatedFijosCorridos = model.entrySession.fijosCorridos.map(b => ({
        ...b,
        fijoAmount: intendedAmountType === 'fijo' ? amountValue : b.fijoAmount,
        corridoAmount: intendedAmountType === 'corrido' ? amountValue : b.corridoAmount,
    }));

    // Actualizar centenas si aplica
    const updatedCentenas = model.entrySession.centenas.map(c => ({
        ...c,
        amount: intendedAmountType === 'centena' ? amountValue : c.amount,
    }));

    // Actualizar parlets si aplica
    const updatedParlets = model.entrySession.parlets.map(p => ({
        ...p,
        amount: intendedAmountType === 'parlet' ? amountValue : p.amount,
    }));

    log.info('applyAmountAll: Monto aplicado a todas las apuestas actuales', { intendedAmountType });

    return updateSummary({
        ...model,
        entrySession: {
            ...model.entrySession,
            fijosCorridos: updatedFijosCorridos,
            centenas: updatedCentenas,
            parlets: updatedParlets,
        },
        editState: clearAmountConfirmation(model).editState
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
        isEditing: true,
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
