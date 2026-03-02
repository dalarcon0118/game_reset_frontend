import { match } from 'ts-pattern';
import { BolitaModel, InputOwner } from '../domain/models/bolita.types';
import { initialBolitaListData } from '../domain/models/bolita.initial';
import {
    BolitaMsg,
    SAVE_ALL_BETS,
    SAVE_BETS_RESPONSE,
    FIJOS,
    CENTENA,
    PARLET
} from '../domain/models/bolita.messages';
import { Return, ret, singleton } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { BolitaImpl } from '../domain/bolita.impl';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { RemoteData } from '@/shared/core/remote.data';
import { logger } from '@/shared/utils/logger';

// Message imports for orchestration
import { FIJOS_CONFIRM_INPUT } from '../domain/models/bolita.messages';
import { CENTENA_CONFIRM_INPUT } from '../domain/models/bolita.messages';
import { PARLET_CONFIRM_INPUT } from '../domain/models/bolita.messages';

const log = logger.withTag('BOLITA_FLOWS');

/**
 * 🌊 BOLITA FLOWS
 * 
 * Orchestration layer for Bolita feature.
 * Centralizes complex user flows and side effects.
 * Following the TEA Clean Feature Design.
 */
export const BolitaFlows = {

    // --- UI Interactions (Keyboard & Input) ---

    /**
     * Centralized key press handler.
     * Manages the input string state across all sub-features.
     */
    handleKeyPress: (model: BolitaModel, key: string): Return<BolitaModel, BolitaMsg> => {
        let currentInput = model.editState.currentInput;

        log.debug('handleKeyPress', { key, prev: currentInput });

        if (key === 'backspace') {
            return ret(
                {
                    ...model,
                    editState: {
                        ...model.editState,
                        currentInput: currentInput.slice(0, -1)
                    }
                },
                Cmd.none
            );
        }

        if (key === 'Enter' || key === 'OK' || key === 'confirm') {
            return BolitaFlows.handleConfirmInput(model);
        }

        return ret(
            {
                ...model,
                editState: {
                    ...model.editState,
                    currentInput: currentInput + key
                }
            },
            Cmd.none
        );
    },

    /**
     * Centralized input confirmation handler.
     * Routes the confirmation to the appropriate submodule based on context.
     */
    handleConfirmInput: (model: BolitaModel): Return<BolitaModel, BolitaMsg> => {
        const { activeOwner, showBetKeyboard, showAmountKeyboard } = model.editState;

        log.debug('handleConfirmInput', { activeOwner, showBetKeyboard, showAmountKeyboard });

        // Check context
        if (showAmountKeyboard || showBetKeyboard) {
            return match<InputOwner | null, Return<BolitaModel, BolitaMsg>>(activeOwner)
                .with('centena', () => ret(model, Cmd.ofMsg(CENTENA(CENTENA_CONFIRM_INPUT()))))
                .with('parlet', () => ret(model, Cmd.ofMsg(PARLET(PARLET_CONFIRM_INPUT()))))
                .with('fijos', () => ret(model, Cmd.ofMsg(FIJOS(FIJOS_CONFIRM_INPUT()))))
                .otherwise(() => ret(model, Cmd.ofMsg(FIJOS(FIJOS_CONFIRM_INPUT()))));
        }

        // Safety fallback
        return singleton(model);
    },

    // --- Persistence Flows (Use Cases) ---

    /**
     * Orchestrates the complete save flow for all bets in the session.
     */
    saveAllBets: (model: BolitaModel, drawId: string): Return<BolitaModel, BolitaMsg> => {
        log.info('saveAllBets starting...', { drawId });

        // 1. Pure Validation Step (using Domain Implementation)
        const validation = BolitaImpl.persistence.validateAndPrepare(model, drawId);

        if (validation.type === 'Invalid') {
            log.warn('SAVE_ABORTED: Validation failed', { reason: validation.reason });
            return ret(
                model,
                Cmd.alert({
                    title: 'Error de Validación',
                    message: validation.reason
                })
            );
        }

        // 2. Prepare Payload
        const payload = validation.payload;

        // 3. Trigger HTTP Side Effect
        return ret<BolitaModel, BolitaMsg>(
            {
                ...model,
                summary: { ...model.summary, isSaving: true }
            },
            Cmd.task({
                task: () => betRepository.placeBatch([payload]),
                onSuccess: (res) => SAVE_BETS_RESPONSE({ response: RemoteData.success(res) }),
                onFailure: (err) => SAVE_BETS_RESPONSE({ response: RemoteData.failure(err) })
            })
        );
    },

    /**
     * Handles the response from the save operation.
     */
    handleSaveResponse: (model: BolitaModel, response: RemoteData<any, any>): Return<BolitaModel, BolitaMsg> => {
        return match<RemoteData<any, any>, Return<BolitaModel, BolitaMsg>>(response)
            .with({ type: 'Success' }, () => {
                log.info('SAVE_SUCCESS');
                return ret(
                    {
                        ...model,
                        entrySession: initialBolitaListData,
                        summary: { ...model.summary, isSaving: false, hasBets: false, grandTotal: 0 }
                    },
                    Cmd.alert({
                        title: 'Éxito',
                        message: 'Apuestas guardadas correctamente.'
                    })
                );
            })
            .with({ type: 'Failure' }, ({ error }) => {
                log.error('SAVE_FAILURE', { error: error.message });
                return ret(
                    {
                        ...model,
                        summary: { ...model.summary, isSaving: false }
                    },
                    Cmd.alert({
                        title: 'Error',
                        message: `No se pudieron guardar las apuestas: ${error.message}`
                    })
                );
            })
            .otherwise(() => ret<BolitaModel, BolitaMsg>(model, Cmd.none));
    }
};
