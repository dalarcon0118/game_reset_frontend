import { match } from 'ts-pattern';
import { ok, err, Result } from 'neverthrow';
import { BolitaModel } from '../../domain/models/bolita.types';
import { ParletMsg } from '../../domain/models/bolita.messages';
import { Return, singleton, ret, Cmd } from '@/shared/core/tea-utils';
import { BolitaImpl } from '../../domain/bolita.impl';
import { logger } from '@/shared/utils/logger';
import {
    clearEditState,
    openAmountKeyboard,
    openBetKeyboard,
    closeBetKeyboard,
    closeAmountKeyboard
} from './shared/edit-state.helpers';
import { updateSummary } from './shared/amount-confirmation.helpers';
import { FijosCorridosBet, ParletBet } from '@/types';

const log = logger.withTag('BOLITA_PARLET_UPDATE');

// ============================================================================
// Domain Helpers (Functional Logic with Result)
// ============================================================================

/**
 * Valida si existen fijos disponibles y si forman un parlet válido.
 */
const validateAvailableFijos = (model: BolitaModel): Result<number[], string> => {
    const numbers = model.entrySession.fijosCorridos
        .filter(f => !f.usedInParlet)
        .map(f => f.bet);

    if (numbers.length === 0) return err('No hay fijos disponibles');
    if (!BolitaImpl.validation.isValidParlet(numbers)) return err('Números insuficientes para parlet');

    return ok(numbers);
};

/**
 * Genera todas las combinaciones posibles de pares a partir de una lista de números.
 */
const generatePairs = (numbers: number[]): number[][] => {
    const pairs: number[][] = [];
    for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            pairs.push([numbers[i], numbers[j]]);
        }
    }
    return pairs;
};

/**
 * Encapsula el contexto necesario para la creación de un parlet.
 */
interface ParletContext {
    model: BolitaModel;
    numbers: number[];
    newParlets?: ParletBet[];
    updatedFijos?: FijosCorridosBet[];
}

const prepareParletData = (ctx: ParletContext): Result<ParletContext, string> => {
    const pairs = generatePairs(ctx.numbers);

    log.info('prepareParletData: Combinaciones generadas', {
        inputCount: ctx.numbers.length,
        pairsCount: pairs.length,
        pairs
    });

    const newParlets: ParletBet[] = pairs.map(pair => ({
        id: Math.random().toString(36).substr(2, 9),
        bets: pair,
        amount: 0
    }));

    const updatedFijos = ctx.model.entrySession.fijosCorridos.map(f =>
        ctx.numbers.includes(f.bet) ? { ...f, usedInParlet: true } : f
    );

    return ok({ ...ctx, newParlets, updatedFijos });
};

const applyParletToModel = (ctx: ParletContext): BolitaModel => {
    const newModel: BolitaModel = {
        ...ctx.model,
        isEditing: true,
        entrySession: {
            ...ctx.model.entrySession,
            parlets: [...ctx.model.entrySession.parlets, ...(ctx.newParlets || [])],
            fijosCorridos: ctx.updatedFijos!
        }
    };
    log.info('applyParletToModel: Modelo actualizado', {
        newParletsCount: ctx.newParlets?.length || 0,
        totalParlets: newModel.entrySession.parlets.length,
        isEditing: newModel.isEditing
    });
    return newModel;
};

// ============================================================================
// Main Update Function
// ============================================================================

export const updateParlet = (model: BolitaModel, msg: ParletMsg): Return<BolitaModel, ParletMsg> => {
    return match<ParletMsg, Return<BolitaModel, ParletMsg>>(msg)
        .with({ type: 'SHOW_PARLET_DRAWER' }, ({ payload: { visible } }) => {
            log.info('SHOW_PARLET_DRAWER', { visible });

            return singleton({
                ...model,
                parletSession: {
                    ...model.parletSession,
                    isParletDrawerVisible: visible
                }
            });
        })
        .with({ type: 'PRESS_ADD_PARLET' }, () => {
            log.info('PRESS_ADD_PARLET: Validando disponibilidad de fijos');

            const validation = validateAvailableFijos(model);

            if (validation.isOk()) {
                const numbers = validation.value;
                log.info('PRESS_ADD_PARLET: Fijos validados, mostrando alerta', { numbers });
                return ret<BolitaModel, ParletMsg>({ ...model, isEditing: true }, Cmd.alert({
                    title: 'Confirmar Parlet',
                    message: `¿Desea agregar los números ${numbers.join('-')} como parlet?`,
                    buttons: [
                        { text: 'Cancelar', onPressMsg: { type: 'CANCEL_PARLET_BET' }, style: 'cancel' },
                        { text: 'Agregar', onPressMsg: { type: 'CONFIRM_PARLET_BET', payload: { numbers } } }
                    ]
                }));
            }

            return singleton(openBetKeyboard(model, 'parlet'));
        })
        .with({ type: 'CONFIRM_PARLET_BET' }, ({ payload: { numbers } }) => {
            log.info('CONFIRM_PARLET_BET: Iniciando cadena de transformación', { numbers });

            const result = ok<ParletContext, string>({ model, numbers })
                .andThen(prepareParletData)
                .map(applyParletToModel)
                .map(updateSummary);

            return result.isOk()
                ? singleton(result.value)
                : singleton(model); // En teoría no debería fallar aquí si ya fue validado
        })
        .with({ type: 'CANCEL_PARLET_BET' }, () => {
            log.info('CANCEL_PARLET_BET: Redirigiendo a entrada manual');
            return singleton(openBetKeyboard(model, 'parlet'));
        })
        .with({ type: 'EDIT_PARLET_BET' }, ({ payload: { betId } }) => {
            log.info('EDIT_PARLET_BET', { betId });
            return singleton(openBetKeyboard(model, 'parlet', betId));
        })
        .with({ type: 'DELETE_PARLET_BET' }, ({ payload: { betId } }) => {
            log.info('DELETE_PARLET_BET', { betId });

            const newModel: BolitaModel = {
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    parlets: model.entrySession.parlets.filter(p => p.id !== betId)
                }
            };

            return singleton(updateSummary(newModel));
        })
        .with({ type: 'UPDATE_PARLET_BET' }, ({ payload: { betId, changes } }) => {
            const newModel: BolitaModel = {
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    parlets: model.entrySession.parlets.map(p =>
                        p.id === betId ? { ...p, ...changes } : p
                    )
                }
            };

            return singleton(updateSummary(newModel));
        })
        .with({ type: 'OPEN_PARLET_AMOUNT_KEYBOARD' }, ({ payload: { betId } }) => {
            return singleton(openAmountKeyboard(model, 'parlet', betId, 'parlet'));
        })
        .with({ type: 'CLOSE_PARLET_BET_KEYBOARD' }, () => {
            return singleton(closeBetKeyboard(model));
        })
        .with({ type: 'CLOSE_PARLET_AMOUNT_KEYBOARD' }, () => {
            return singleton(closeAmountKeyboard(model));
        })
        .with({ type: 'PARLET_CONFIRM_INPUT' }, () => {
            log.info('PARLET_CONFIRM_INPUT: Procesando entrada');

            const { currentInput, showAmountKeyboard, showBetKeyboard, editingBetId } = model.editState;

            // CASO 1: Procesando Monto
            if (showAmountKeyboard && editingBetId) {
                const amount = parseInt(currentInput, 10) || 0;
                log.info('PARLET_CONFIRM_INPUT: Aplicando monto', { amount, editingBetId });

                const updatedParlets = model.entrySession.parlets.map(p =>
                    p.id === editingBetId ? { ...p, amount } : p
                );

                const newModel: BolitaModel = {
                    ...model,
                    isEditing: true,
                    entrySession: {
                        ...model.entrySession,
                        parlets: updatedParlets,
                    }
                };

                return singleton(updateSummary(clearEditState(newModel)));
            }

            // CASO 2: Procesando Números (Entrada manual)
            if (showBetKeyboard) {
                // Parsear entrada en pares (ej: "121516" -> [12, 15, 16])
                const numbers = BolitaImpl.validation.parseInput(currentInput, 2);
                log.info('PARLET_CONFIRM_INPUT: Números parseados', { currentInput, numbers });

                if (numbers.length < 2) {
                    return singleton(clearEditState(model));
                }

                const result = ok<ParletContext, string>({ model, numbers })
                    .andThen(prepareParletData)
                    .map(applyParletToModel)
                    .map(updateSummary);

                return result.isOk()
                    ? singleton(clearEditState(result.value))
                    : singleton(clearEditState(model));
            }

            return singleton(clearEditState(model));
        })
        .otherwise(() => singleton(model));
};
