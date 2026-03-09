import { match } from 'ts-pattern';
import { ok, err, Result } from 'neverthrow';
import { BolitaModel } from '../../domain/models/bolita.types';
import { CentenaMsg } from '../../domain/models/bolita.messages';
import { Return, ret, singleton, Cmd } from '@/shared/core/tea-utils';
import { BolitaImpl } from '../../domain/bolita.impl';
import { logger } from '@/shared/utils/logger';
import {
    clearEditState,
    openAmountKeyboard,
    openBetKeyboard,
    closeBetKeyboard,
    closeAmountKeyboard
} from './shared/edit-state.helpers';
import {
    updateSummary,
    applyAmountSingle,
    applyAmountAll,
    clearAmountConfirmation,
    prepareAmountConfirmation
} from './shared/amount-confirmation.helpers';
import { CentenaBet } from '@/types';

const log = logger.withTag('BOLITA_CENTENA_UPDATE');

// ============================================================================
// Domain Helpers (Functional Logic with Result)
// ============================================================================

/**
 * Procesa la confirmación de entrada para una centena (monto o número).
 */
const processCentenaInput = (model: BolitaModel): Result<BolitaModel, string> => {
    const { currentInput, showAmountKeyboard, showBetKeyboard, editingBetId } = model.editState;

    if (!showAmountKeyboard && !showBetKeyboard) {
        return ok(model);
    }

    if (showAmountKeyboard) {
        if (!editingBetId) return err('Sin ID de apuesta para monto');
        const amount = parseInt(currentInput, 10) || 0;

        return ok(prepareAmountConfirmation(model, amount));
    }

    if (showBetKeyboard) {
        if (editingBetId) {
            // Edit existing bet (one only)
            const bet = parseInt(currentInput, 10) || 0;
            const updatedCentenas = model.entrySession.centenas.map(c =>
                c.id === editingBetId ? { ...c, bet } : c
            );
            return ok({
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    centenas: updatedCentenas,
                }
            });
        } else {
            // Add new bets (potentially multiple)
            const numbers = BolitaImpl.validation.parseInput(currentInput, 3);
            if (numbers.length === 0) return ok(model);

            const newCentenas: CentenaBet[] = numbers.map(n => ({
                id: Math.random().toString(36).substr(2, 9),
                bet: n,
                amount: null, // Use null for "$" placeholder
            }));

            return ok({
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    centenas: [...model.entrySession.centenas, ...newCentenas]
                }
            });
        }
    }

    return ok(model);
};

// ============================================================================
// Main Update Function
// ============================================================================

export const updateCentena = (model: BolitaModel, msg: CentenaMsg): Return<BolitaModel, CentenaMsg> => {
    return match<CentenaMsg, Return<BolitaModel, CentenaMsg>>(msg)
        .with({ type: 'SHOW_CENTENA_DRAWER' }, ({ payload: { visible } }) => {
            return singleton({
                ...model,
                centenaSession: {
                    ...model.centenaSession,
                    isCentenaDrawerVisible: visible
                }
            });
        })
        .with({ type: 'PRESS_ADD_CENTENA' }, () => {
            log.info('PRESS_ADD_CENTENA: Abriendo teclado para nueva centena');
            return singleton(openBetKeyboard(model, 'centena'));
        })
        .with({ type: 'DELETE_CENTENA_BET' }, ({ payload: { betId } }) => {
            const newModel: BolitaModel = {
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.filter(c => c.id !== betId)
                }
            };

            return singleton(updateSummary(newModel));
        })
        .with({ type: 'UPDATE_CENTENA_BET' }, ({ payload: { betId, changes } }) => {
            const newModel: BolitaModel = {
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    centenas: model.entrySession.centenas.map(c =>
                        c.id === betId ? { ...c, ...changes } : c
                    )
                }
            };

            return singleton(updateSummary(newModel));
        })
        .with({ type: 'EDIT_CENTENA_BET' }, ({ payload: { betId } }) => {
            log.info('EDIT_CENTENA_BET', { betId });
            return singleton(openBetKeyboard(model, 'centena', betId));
        })
        .with({ type: 'OPEN_CENTENA_AMOUNT_KEYBOARD' }, ({ payload: { betId } }) => {
            return singleton(openAmountKeyboard(model, 'centena', betId, 'centena'));
        })
        .with({ type: 'CLOSE_CENTENA_BET_KEYBOARD' }, () => {
            return singleton(closeBetKeyboard(model));
        })
        .with({ type: 'CLOSE_CENTENA_AMOUNT_KEYBOARD' }, () => {
            return singleton(closeAmountKeyboard(model));
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
        .with({ type: 'CENTENA_CONFIRM_INPUT' }, () => {
            log.info('CENTENA_CONFIRM_INPUT: Iniciando cadena funcional');

            const result = ok<BolitaModel, string>(model)
                .andThen(processCentenaInput)
                .map(updateSummary);

            return result.match(
                (newModel) => {
                    // Si hay una confirmación de monto pendiente, mostrar la alerta
                    if (newModel.editState.amountConfirmationDetails) {
                        const { amountValue, intendedAmountType } = newModel.editState.amountConfirmationDetails;

                        // Contar cuántas apuestas del mismo tipo existen
                        const betCount = newModel.entrySession.centenas.length;

                        // Si solo hay una apuesta, aplicar directamente sin preguntar
                        if (betCount <= 1) {
                            log.info('CENTENA_CONFIRM_INPUT: Solo una apuesta detectada, aplicando monto directamente');
                            const finalModel = {
                                ...newModel,
                                editState: {
                                    ...newModel.editState,
                                    showAmountKeyboard: false,
                                    currentInput: '',
                                }
                            };
                            return singleton(applyAmountSingle(finalModel));
                        }

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
                (error) => {
                    log.error('CENTENA_CONFIRM_INPUT: Error en confirmación', { error });
                    return singleton(clearEditState(model));
                }
            );
        })
        .otherwise(() => singleton(model));
};
