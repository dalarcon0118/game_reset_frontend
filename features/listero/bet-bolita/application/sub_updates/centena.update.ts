import { match } from 'ts-pattern';
import { ok, err, Result } from 'neverthrow';
import { BolitaModel } from '../../domain/models/bolita.types';
import { CentenaMsg } from '../../domain/models/bolita.messages';
import { Return, singleton } from '@/shared/core/tea-utils';
import { logger } from '@/shared/utils/logger';
import {
    clearEditState,
    openAmountKeyboard,
    closeBetKeyboard,
    closeAmountKeyboard
} from './shared/edit-state.helpers';
import { updateSummary } from './shared/amount-confirmation.helpers';
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
        const updatedCentenas = model.entrySession.centenas.map(c =>
            c.id === editingBetId ? { ...c, amount } : c
        );
        return ok({
            ...model,
            isEditing: true,
            entrySession: {
                ...model.entrySession,
                centenas: updatedCentenas,
            }
        });
    }

    if (showBetKeyboard) {
        const bet = parseInt(currentInput, 10) || 0;

        if (editingBetId) {
            // Edit existing bet
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
            // Add new bet
            const newCentena: CentenaBet = {
                id: Math.random().toString(36).substr(2, 9),
                bet,
                amount: 0,
            };
            return ok({
                ...model,
                isEditing: true,
                entrySession: {
                    ...model.entrySession,
                    centenas: [...model.entrySession.centenas, newCentena]
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
        .with({ type: 'CENTENA_CONFIRM_INPUT' }, () => {
            log.info('CENTENA_CONFIRM_INPUT: Iniciando cadena funcional');

            const result = ok<BolitaModel, string>(model)
                .andThen(processCentenaInput)
                .map(updateSummary)
                .map(clearEditState);

            return result.match(
                (newModel) => singleton(newModel),
                (error) => {
                    log.error('CENTENA_CONFIRM_INPUT: Error en confirmación', { error });
                    return singleton(clearEditState(model));
                }
            );
        })
        .otherwise(() => singleton(model));
};
