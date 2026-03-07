import { match } from 'ts-pattern';
import { ok, err, Result } from 'neverthrow';
import { BolitaModel } from '../../domain/models/bolita.types';
import { FijosMsg } from '../../domain/models/bolita.messages';
import { Return, ret, singleton, Cmd } from '@/shared/core/tea-utils';
import { BolitaImpl } from '../../domain/bolita.impl';
import { logger } from '@/shared/utils/logger';
import {
    clearEditState,
    openBetKeyboard,
    closeBetKeyboard,
    openAmountKeyboard,
    closeAmountKeyboard
} from './shared/edit-state.helpers';
import {
    updateSummary,
    applyAmountSingle,
    applyAmountAll,
    clearAmountConfirmation,
    prepareAmountConfirmation
} from './shared/amount-confirmation.helpers';
import { FijosCorridosBet } from '@/types';

const log = logger.withTag('BOLITA_FIJOS_UPDATE');

// ============================================================================
// Domain Helpers (Functional Logic with Result)
// ============================================================================

/**
 * Procesa la entrada de números y genera nuevas apuestas de fijos.
 */
const createFijosFromInput = (model: BolitaModel): Result<BolitaModel, string> => {
    const { currentInput, showBetKeyboard } = model.editState;
    if (!showBetKeyboard) return ok(model);

    const numbers = BolitaImpl.validation.parseInput(currentInput, 2);
    if (numbers.length === 0) return ok(model);

    const newBets: FijosCorridosBet[] = numbers.map(n => ({
        id: Math.random().toString(36).substr(2, 9),
        bet: n,
        fijoAmount: null,
        corridoAmount: null,
    }));

    return ok({
        ...model,
        isEditing: true,
        entrySession: {
            ...model.entrySession,
            fijosCorridos: [...model.entrySession.fijosCorridos, ...newBets],
        }
    });
};

/**
 * Valida y prepara la confirmación de monto.
 */
const handleAmountConfirmation = (model: BolitaModel): Result<BolitaModel, string> => {
    const { currentInput, showAmountKeyboard, editingBetId, editingAmountType } = model.editState;
    if (!showAmountKeyboard || !editingBetId || !editingAmountType) return ok(model);

    const amount = parseInt(currentInput, 10) || 0;
    const isFijoOrCorrido = ['fijo', 'corrido'].includes(editingAmountType as string);

    if (!isFijoOrCorrido) return ok(model);

    return ok(prepareAmountConfirmation(model, amount));
};

// ============================================================================
// Main Update Function
// ============================================================================

export const updateFijos = (model: BolitaModel, msg: FijosMsg): Return<BolitaModel, FijosMsg> => {
    return match<FijosMsg, Return<BolitaModel, FijosMsg>>(msg)
        .with({ type: 'OPEN_BET_KEYBOARD' }, () => {
            return singleton(openBetKeyboard(model, 'fijos'));
        })
        .with({ type: 'CLOSE_BET_KEYBOARD' }, () => {
            return singleton(closeBetKeyboard(model));
        })
        .with({ type: 'OPEN_AMOUNT_KEYBOARD' }, ({ payload: { betId, amountType } }) => {
            return singleton(openAmountKeyboard(model, 'fijos', betId, amountType));
        })
        .with({ type: 'CLOSE_AMOUNT_KEYBOARD' }, () => {
            return singleton(closeAmountKeyboard(model));
        })
        .with({ type: 'ADD_FIJOS_BET' }, ({ payload: { fijosBet } }) => {
            log.info('ADD_FIJOS_BET: Creando apuesta directa');

            const newBet: FijosCorridosBet = {
                id: Math.random().toString(36).substr(2, 9),
                bet: fijosBet.number,
                fijoAmount: fijosBet.fijoAmount || 0,
                corridoAmount: fijosBet.corridoAmount || 0,
            };

            const newModel: BolitaModel = {
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    fijosCorridos: [...model.entrySession.fijosCorridos, newBet]
                }
            };

            return singleton(updateSummary(newModel));
        })
        .with({ type: 'UPDATE_FIJOS_BET' }, ({ payload: { betId, changes } }) => {
            const newModel: BolitaModel = {
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    fijosCorridos: model.entrySession.fijosCorridos.map(b =>
                        b.id === betId ? { ...b, ...changes } : b
                    )
                }
            };

            return singleton(updateSummary(newModel));
        })
        .with({ type: 'DELETE_FIJOS_BET' }, ({ payload: { betId } }) => {
            const newModel: BolitaModel = {
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    fijosCorridos: model.entrySession.fijosCorridos.filter(b => b.id !== betId)
                }
            };

            return singleton(updateSummary(newModel));
        })
        .with({ type: 'FIJOS_CONFIRM_INPUT' }, () => {
            log.info('FIJOS_CONFIRM_INPUT: Iniciando cadena funcional');

            const result = ok<BolitaModel, string>(model)
                .andThen(createFijosFromInput)
                .andThen(handleAmountConfirmation)
                .map(updateSummary);

            return result.match(
                (newModel) => {
                    // Si hay una confirmación de monto pendiente, mostrar la alerta
                    if (newModel.editState.amountConfirmationDetails) {
                        const { amountValue } = newModel.editState.amountConfirmationDetails;

                        // Limpiar estado visual del teclado antes de mostrar la alerta
                        const finalModel = {
                            ...newModel,
                            editState: {
                                ...newModel.editState,
                                showAmountKeyboard: false,
                                currentInput: '',
                            }
                        };

                        return ret(finalModel, Cmd.alert({
                            title: '¿Aplicar monto?',
                            message: `Deseas aplicar el monto de ${amountValue} a:`,
                            buttons: [
                                { text: 'Solo a esta', onPressMsg: { type: 'CONFIRM_APPLY_AMOUNT_SINGLE' } },
                                { text: 'A todas', onPressMsg: { type: 'CONFIRM_APPLY_AMOUNT_ALL' } },
                                { text: 'Cancelar', style: 'cancel', onPressMsg: { type: 'CANCEL_AMOUNT_CONFIRMATION' } }
                            ]
                        }));
                    }

                    return singleton(clearEditState(newModel));
                },
                (err) => {
                    log.error('FIJOS_CONFIRM_INPUT: Error en cadena funcional', { err });
                    return singleton(clearEditState(model));
                }
            );
        })
        .with({ type: 'CONFIRM_APPLY_AMOUNT_SINGLE' }, () => {
            return singleton(applyAmountSingle(model));
        })
        .with({ type: 'CONFIRM_APPLY_AMOUNT_ALL' }, () => {
            return singleton(applyAmountAll(model));
        })
        .with({ type: 'CANCEL_AMOUNT_CONFIRMATION' }, () => {
            return singleton(clearAmountConfirmation(model));
        })
        .otherwise(() => singleton(model));
};
