import { match, P } from 'ts-pattern';
import { BolitaModel, InputOwner } from '../domain/models/bolita.types';
import { initialBolitaListData } from '../domain/models/bolita.initial';
import {
    BolitaMsg,
    REQUEST_SAVE_ALL_BETS,
    CONFIRM_SAVE_ALL_BETS,
    SAVE_BETS_RESPONSE,
    FIJOS,
    CENTENA,
    PARLET,
    EDIT,
    CLOSE_KEYBOARD,
    CONFIRM_INPUT
} from '../domain/models/bolita.messages';
import { Return, ret, singleton, Cmd, RemoteData } from '@core/tea-utils';
import { RemoteDataHttp } from '@core/tea-utils/remote.data.http';
import { BolitaImpl } from '../domain/bolita.impl';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { logger } from '@/shared/utils/logger';

// Message imports for orchestration
import { FIJOS_CONFIRM_INPUT, CLOSE_BET_KEYBOARD, CLOSE_AMOUNT_KEYBOARD, OPEN_BET_KEYBOARD } from '../domain/models/bolita.messages';
import { CENTENA_CONFIRM_INPUT, CLOSE_CENTENA_BET_KEYBOARD, CLOSE_CENTENA_AMOUNT_KEYBOARD, PRESS_ADD_CENTENA } from '../domain/models/bolita.messages';
import { PARLET_CONFIRM_INPUT, CLOSE_PARLET_BET_KEYBOARD, CLOSE_PARLET_AMOUNT_KEYBOARD, PRESS_ADD_PARLET } from '../domain/models/bolita.messages';
import { EditMsgType } from '../domain/models/bolita.messages';

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

    /**
     * Centralized keyboard close handler.
     * Closes the appropriate keyboard based on context.
     */
    handleCloseKeyboard: (model: BolitaModel): Return<BolitaModel, BolitaMsg> => {
        const { activeOwner, showBetKeyboard, showAmountKeyboard } = model.editState;

        log.debug('handleCloseKeyboard', { activeOwner, showBetKeyboard, showAmountKeyboard });

        if (showAmountKeyboard) {
            return match<InputOwner | null, Return<BolitaModel, BolitaMsg>>(activeOwner)
                .with('centena', () => ret(model, Cmd.ofMsg(CENTENA(CLOSE_CENTENA_AMOUNT_KEYBOARD()))))
                .with('parlet', () => ret(model, Cmd.ofMsg(PARLET(CLOSE_PARLET_AMOUNT_KEYBOARD()))))
                .with('fijos', () => ret(model, Cmd.ofMsg(FIJOS(CLOSE_AMOUNT_KEYBOARD()))))
                .otherwise(() => ret(model, Cmd.ofMsg(FIJOS(CLOSE_AMOUNT_KEYBOARD()))));
        }

        if (showBetKeyboard) {
            return match<InputOwner | null, Return<BolitaModel, BolitaMsg>>(activeOwner)
                .with('centena', () => ret(model, Cmd.ofMsg(CENTENA(CLOSE_CENTENA_BET_KEYBOARD()))))
                .with('parlet', () => ret(model, Cmd.ofMsg(PARLET(CLOSE_PARLET_BET_KEYBOARD()))))
                .with('fijos', () => ret(model, Cmd.ofMsg(FIJOS(CLOSE_BET_KEYBOARD()))))
                .otherwise(() => ret(model, Cmd.ofMsg(FIJOS(CLOSE_BET_KEYBOARD()))));
        }

        return singleton(model);
    },

    /**
     * Applies the promotion context (betType) to pre-configure the UI.
     */
    applyPromotionContext: (model: BolitaModel, betType?: string): Return<BolitaModel, BolitaMsg> => {
        if (!betType) return singleton(model);

        log.info('applyPromotionContext', { betType });

        switch (betType.toUpperCase()) {
            case 'FIJO':
            case 'CORRIDO':
                return ret(
                    {
                        ...model,
                        editState: { ...model.editState, selectedColumn: 'fijos' }
                    },
                    Cmd.batch([
                        Cmd.ofMsg(EDIT({ type: EditMsgType.SET_EDIT_SELECTED_COLUMN, column: 'fijos' })),
                        Cmd.ofMsg(FIJOS(OPEN_BET_KEYBOARD()))
                    ])
                );

            case 'PARLET':
                return ret(
                    {
                        ...model,
                        editState: { ...model.editState, selectedColumn: 'parlet' }
                    },
                    Cmd.batch([
                        Cmd.ofMsg(EDIT({ type: EditMsgType.SET_EDIT_SELECTED_COLUMN, column: 'parlet' })),
                        Cmd.ofMsg(PARLET(PRESS_ADD_PARLET({ fijosCorridosList: model.entrySession.fijosCorridos })))
                    ])
                );

            case 'CENTENA':
                return ret(
                    {
                        ...model,
                        editState: { ...model.editState, selectedColumn: 'centena' }
                    },
                    Cmd.batch([
                        Cmd.ofMsg(EDIT({ type: EditMsgType.SET_EDIT_SELECTED_COLUMN, column: 'centena' })),
                        Cmd.ofMsg(CENTENA(PRESS_ADD_CENTENA()))
                    ])
                );

            default:
                return singleton(model);
        }
    },

    // --- Persistence Flows (Use Cases) ---

    /**
     * Shows a confirmation alert before saving.
     */
    requestSaveAllBets: (model: BolitaModel, drawId: string): Return<BolitaModel, BolitaMsg> => {
        log.info('requestSaveAllBets triggered', { drawId });

        // 1. Pure Validation Step (using Domain Implementation)
        const validation = BolitaImpl.persistence.validateAndPrepare(model, drawId);

        if (validation.type === 'Invalid') {
            log.warn('SAVE_ABORTED: Validation failed', { reason: validation.reason });

            // Si el error es por falta de estructura, es probable que la sesión haya expirado
            const isSessionError = validation.reason.includes('estructura');

            return ret(
                model,
                Cmd.alert({
                    title: isSessionError ? 'Sesión no válida' : 'Error de Validación',
                    message: isSessionError
                        ? 'No se pudo identificar tu sesión. Por favor, verifica tu conexión o vuelve a iniciar sesión.'
                        : validation.reason
                })
            );
        }

        // 2. Trigger Confirmation Alert
        return ret(
            model,
            Cmd.alert({
                title: 'Confirmar Apuestas',
                message: `¿Estás seguro de que deseas guardar estas apuestas por un total de $${model.summary.grandTotal}?`,
                buttons: [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Guardar',
                        onPressMsg: CONFIRM_SAVE_ALL_BETS({ drawId })
                    }
                ]
            })
        );
    },

    /**
     * Orchestrates the complete save flow for all bets in the session.
     */
    executeSaveAllBets: (model: BolitaModel, drawId: string): Return<BolitaModel, BolitaMsg> => {
        log.info('executeSaveAllBets starting...', { drawId });

        // 1. Prepare Payload (Already validated in requestSaveAllBets, but good to double check)
        const validation = BolitaImpl.persistence.validateAndPrepare(model, drawId);
        if (validation.type === 'Invalid') return singleton(model);

        const payload = validation.payload;

        // 2. Trigger HTTP Side Effect
        log.info('SAVE_BETS_INIT', { payload_count: payload.length });
        return ret<BolitaModel, BolitaMsg>(
            {
                ...model,
                currentDrawId: drawId,
                summary: { ...model.summary, isSaving: true }
            },
            RemoteDataHttp.fetch(
                () => betRepository.placeBatch(payload),
                (response) => SAVE_BETS_RESPONSE({ response }),
                'SAVE_BETS'
            )
        );
    },

    /**
     * Handles the response from the save operation.
     */
    handleSaveResponse: (model: BolitaModel, response: RemoteData<any, any>): Return<BolitaModel, BolitaMsg> => {
        return match<RemoteData<any, any>, Return<BolitaModel, BolitaMsg>>(response)
            .with({ type: 'Success' }, ({ data }) => {
                log.info('SAVE_SUCCESS', { data });

                // Intentamos extraer el receiptCode del primer elemento si existe
                const receiptCode = (Array.isArray(data) && data.length > 0) ? data[0].receiptCode : null;
                const drawId = model.currentDrawId;
                const successRoute = receiptCode
                    ? drawId
                        ? `/lister/bet_success?receiptCode=${receiptCode}&drawId=${drawId}`
                        : `/lister/bet_success?receiptCode=${receiptCode}`
                    : '/lister/bet_success';

                return ret(
                    {
                        ...model,
                        entrySession: initialBolitaListData,
                        summary: {
                            ...model.summary,
                            isSaving: false,
                            hasBets: false,
                            grandTotal: 0,
                            pendingReceiptCode: receiptCode
                        }
                    },
                    Cmd.batch([
                        Cmd.navigate(successRoute),
                        Cmd.alert({
                            title: 'Éxito',
                            message: 'Apuestas guardadas correctamente.'
                        })
                    ])
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
