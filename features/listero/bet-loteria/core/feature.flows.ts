import { match } from 'ts-pattern';
import { LoteriaFeatureModel, FeatureMsg } from './feature.types';
import { Return, ret } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { LoteriaDomain } from './feature.domain';
import { LoteriaBet, GameType } from '@/types';
import { initialModel } from './store';
import {
    CONFIRM_SAVE_BETS,
    SAVE_BETS_RESPONSE,
    SAVE_SUCCESS,
    SAVE_FAILURE,
    OPEN_BET_KEYBOARD,
    CLOSE_BET_KEYBOARD,
    OPEN_AMOUNT_KEYBOARD,
    CLOSE_AMOUNT_KEYBOARD,
    INIT,
    REFRESH_BETS,
    LoteriaFeatMsg
} from '../loteria/loteria.types';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { WebData, RemoteData } from '@/shared/core/remote.data';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { drawRepository } from '@/shared/repositories/draw';
import { logger } from '@/shared/utils/logger';
import { BET_TYPE_KEYS, isLoteriaType } from '@/shared/types/bet_types';
import { BetType } from '@/types';

const log = logger.withTag('LOTERIA_FLOWS');

/**
 * 🌊 FEATURE FLOWS
 * 
 * This layer orchestrates complete user interactions (Use Cases).
 * It bridges the gap between Raw Events (Msg) and Domain Logic.
 * 
 * Benefits:
 * - Readability: Each function describes a complete story (e.g. "User Submits Bet").
 * - Maintainability: All related logic (validation, state update, side effects) is in one place.
 * - Testability: Easier to integration test these flows than raw reducers.
 */
export const FeatureFlows = {

    // --- UI Interactions ---

    handleKeyPress: (model: LoteriaFeatureModel, key: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        const nextInput = LoteriaDomain.handleKeyPress(
            model.editSession.currentInput,
            key,
            model.loteriaSession.isBetKeyboardVisible
        );

        log.debug('KEY_PRESSED', { key, nextInput });

        return ret(
            { ...model, editSession: { ...model.editSession, currentInput: nextInput } },
            Cmd.none
        );
    },

    handleInputConfirmation: (model: LoteriaFeatureModel): Return<LoteriaFeatureModel, FeatureMsg> => {
        const { currentInput } = model.editSession;

        // Route to specific sub-flow based on context
        if (model.loteriaSession.isBetKeyboardVisible) {
            return FeatureFlows.submitNewBet(model, currentInput);
        }

        if (model.loteriaSession.isAmountKeyboardVisible) {
            return FeatureFlows.submitBetAmount(model, currentInput);
        }

        return ret(model, Cmd.none);
    },

    resetInput: (model: LoteriaFeatureModel): Return<LoteriaFeatureModel, FeatureMsg> => {
        return ret(LoteriaDomain.resetInput(model), Cmd.none);
    },

    // --- Orchestration Flows ---

    init: (model: LoteriaFeatureModel, drawId: string, isEditing: boolean = true, structureId?: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        // IMPORTANTE: Usar initialModel en lugar de model para reiniciar el estado completamente
        // Esto asegura que las apuestas anteriores se borren al entrar al screen
        const baseState = {
            ...initialModel,
            currentDrawId: drawId,
            isEditing,
            structureId: structureId || initialModel.structureId,
        };

        const loadingModel: LoteriaFeatureModel = {
            ...baseState,
            managementSession: {
                ...baseState.managementSession,
                drawDetails: RemoteData.loading(),
                betTypes: { ...baseState.managementSession.betTypes, loteria: null }
            },
            listSession: {
                ...baseState.listSession,
                // Si estamos anotando, iniciamos con lista limpia (Success([])).
                // Si es solo lectura, iniciamos en Loading para cargar las existentes desde el servidor.
                remoteData: isEditing ? RemoteData.success({ loteria: [] }) : RemoteData.loading()
            }
        };

        const cmds = [
            FeatureFlows.fetchDrawDetails(drawId),
            FeatureFlows.fetchBetTypes(drawId),
        ];

        // Solo cargamos apuestas existentes si NO estamos en modo anotación (isEditing: false)
        // Nota: betTypes.loteria se establece como null inicialmente y se completa tras fetchBetTypes
        if (!isEditing) {
            cmds.push(FeatureFlows.fetchExistingBets(drawId, null));
        }

        return ret(
            loadingModel,
            Cmd.batch(cmds)
        );
    },

    refreshBets: (model: LoteriaFeatureModel, drawId: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        return ret(
            { ...model, listSession: { ...model.listSession, isRefreshing: true } },
            FeatureFlows.fetchExistingBets(drawId)
        );
    },

    // --- Internal Data Fetching ---

    fetchDrawDetails: (drawId: string): Cmd => {
        return RemoteDataHttp.fetch<any, FeatureMsg>(
            async () => {
                const result = await drawRepository.getDraw(drawId);
                if (result.isErr()) throw result.error;
                return result.value;
            },
            (response) => ({ type: 'FETCH_DRAW_DETAILS_RESPONSE', response })
        );
    },

    fetchBetTypes: (drawId: string): Cmd => {
        log.debug('FETCH_BET_TYPES', { drawId });
        return RemoteDataHttp.fetch<GameType[], FeatureMsg>(
            async () => {
                const result = await drawRepository.getBetTypes(drawId);

                if (result.isErr()) {
                    log.error('FETCH_BET_TYPES_ERROR', {
                        drawId,
                        error: result.error.message
                    });
                    throw result.error;
                }

                log.debug('FETCH_BET_TYPES_SUCCESS', {
                    drawId,
                    count: result.value.length
                });

                return result.value.map((t): GameType => ({
                    id: String(t.id),
                    name: t.name,
                    code: t.code || '',
                    description: t.description || ''
                }));
            },
            (response) => ({ type: 'FETCH_BET_TYPES_RESPONSE', response })
        );
    },

    fetchExistingBets: (drawId: string, betTypeId?: string | null): Cmd => {
        log.debug('FETCH_EXISTING_BETS', { drawId, betTypeId });
        return RemoteDataHttp.fetch<LoteriaBet[], FeatureMsg>(
            async () => {
                const result = await betRepository.getBets({ drawId });

                if (result.isErr()) {
                    log.error('FETCH_EXISTING_BETS_ERROR', {
                        drawId,
                        error: result.error.message
                    });
                    throw result.error;
                }

                log.debug('FETCH_EXISTING_BETS_SUCCESS', {
                    drawId,
                    totalBets: result.value.length
                });

                return result.value
                    .filter((b: BetType) => {
                        // DEBUG: Log para entender el filtro isLoteriaType
                        const isLoteria = isLoteriaType(b.type || '', b.betTypeId);
                        log.debug('LOTERIA_FILTER_DEBUG', {
                            betId: b.id,
                            type: b.type,
                            betTypeId: b.betTypeId,
                            draw: b.draw,
                            numbers: b.numbers,
                            amount: b.amount,
                            isLoteria
                        });
                        if (betTypeId) {
                            return String(b.betTypeId) === String(betTypeId);
                        }
                        // Use isLoteriaType for flexible matching (case, accents, Cuaterna/Semanal fallback)
                        return isLoteria;
                    })
                    .map((b: BetType) => ({
                        id: b.id,
                        bet: b.numbers, // Mapeo crítico para visualización en Loteria
                        amount: b.amount,
                        receiptCode: b.receiptCode, // 🛡️ CRITICAL: Mapear el código de recibo para agrupación
                        betTypeid: b.betTypeId,
                        drawid: b.draw
                    })) as unknown as LoteriaBet[];
            },
            (response) => ({ type: 'FETCH_EXISTING_BETS_RESPONSE', response })
        );
    },

    // --- Core Business Flows ---

    submitNewBet: (model: LoteriaFeatureModel, input: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        // 1. Get effective amount based on rules or defaults (150)
        const effectiveAmount = LoteriaDomain.getEffectiveAmount(model);

        // 2. Delegate to Domain (Pure Logic) - Now includes the fixed amount
        const result = LoteriaDomain.addBet(model, input, effectiveAmount);

        // 3. Handle Invalid Input (Early Exit)
        if (!result) return ret(model, Cmd.none);

        const { model: updatedModel, newBet } = result;

        // 4. Orchestrate Next Step
        // If the bet already has an amount (fixed), we don't need to open the keyboard.
        // This allows for a much faster "Rapid Fire" entry flow.
        const needsManualAmount = newBet.amount === null;

        const nextStepCmd = needsManualAmount
            ? Cmd.ofMsg(LoteriaFeatMsg(OPEN_AMOUNT_KEYBOARD({ betId: newBet.id })))
            : Cmd.ofMsg(LoteriaFeatMsg(CLOSE_BET_KEYBOARD()));

        return ret(updatedModel, nextStepCmd);
    },

    submitBetAmount: (model: LoteriaFeatureModel, amount: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        // 1. Delegate to Domain (Updates bets and resets input)
        const updatedModel = LoteriaDomain.submitAmount(model, amount);

        // 2. Handle Failure
        if (!updatedModel) return ret(model, Cmd.none);

        // 3. Side Effect: Signal UI to close the keyboard
        // We use CLOSE_AMOUNT_KEYBOARD to ensure updateLoteria handles the UI state change
        const closeCmd = Cmd.ofMsg(LoteriaFeatMsg(CLOSE_AMOUNT_KEYBOARD()));

        return ret(updatedModel, closeCmd);
    },

    // --- Persistence Flows ---

    requestSave: (model: LoteriaFeatureModel, drawId: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        // 1. Prepare for save (validations, etc.)
        const readyModel = LoteriaDomain.prepareSave(model);

        // 2. Trigger Alert (Side Effect via Cmd)
        const confirmAlertCmd = Cmd.alert({
            title: 'Confirmar Apuesta',
            message: '¿Estás seguro de que deseas guardar las apuestas?',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Guardar',
                    onPressMsg: LoteriaFeatMsg(CONFIRM_SAVE_BETS({ drawId }))
                }
            ]
        });

        return ret(readyModel, confirmAlertCmd);
    },

    executeSave: (model: LoteriaFeatureModel, drawId: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        // 1. Set Loading State
        const loadingModel = {
            ...model,
            summary: { ...model.summary, isSaving: true, error: null }
        };

        // 2. Create HTTP Command via RemoteDataHttp.fetch
        const saveCmd = RemoteDataHttp.fetch<any, FeatureMsg>(
            async () => {
                const payload = LoteriaDomain.createSavePayload(model, drawId);
                // Use Repository instead of Service to support offline-first
                return await betRepository.placeBet(payload);
            },
            (response: WebData<any>) => LoteriaFeatMsg(SAVE_BETS_RESPONSE({ response }))
        );

        return ret(loadingModel, saveCmd);
    },

    handleSaveResponse: (model: LoteriaFeatureModel, response: WebData<any>): Return<LoteriaFeatureModel, FeatureMsg> => {
        // 1. Use match to handle all states
        return match(response)
            .with({ type: 'Failure' }, ({ error }) => FeatureFlows.finalizeSaveFailure(model, error))
            .with({ type: 'Success' }, () => FeatureFlows.finalizeSaveSuccess(model))
            .otherwise(() => ret(model, Cmd.none));
    },

    finalizeSaveSuccess: (model: LoteriaFeatureModel): Return<LoteriaFeatureModel, FeatureMsg> => {
        // Extract receipt code before clearing the model
        const receiptCode = model.summary.pendingReceiptCode;
        const drawId = model.currentDrawId;

        log.debug('FINALIZE_SAVE_SUCCESS', { receiptCode, drawId });

        if (!receiptCode) {
            log.warn('SAVE_SUCCESS_WITHOUT_RECEIPT_CODE', {
                hasBets: model.entrySession.loteria.length > 0,
                currentDrawId: model.currentDrawId
            });
        }

        // 1. Update State (Clear bets, success message)
        const successModel = LoteriaDomain.handleSaveSuccess(model);

        // 2. Side Effect: Navigation and Signal
        const navigationCmd = Cmd.batch([
            Cmd.navigate(receiptCode ? `/lister/bet_success?receiptCode=${receiptCode}&drawId=${drawId}` : '/lister/bet_success'),
            Cmd.ofMsg(LoteriaFeatMsg(SAVE_SUCCESS()))
        ]);

        return ret(successModel, navigationCmd);
    },

    finalizeSaveFailure: (model: LoteriaFeatureModel, error: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        // 1. Delegate to Domain (Pure Logic)
        const errorModel = LoteriaDomain.handleSaveFailure(model, error);

        // 2. Side Effect: Alert and Signal
        const errorCmd = Cmd.batch([
            Cmd.alert({
                title: 'Error al Guardar',
                message: `Ocurrió un problema al guardar las apuestas: ${error}`,
                buttons: [{ text: 'Entendido' }]
            }),
            Cmd.ofMsg(LoteriaFeatMsg(SAVE_FAILURE({ error })))
        ]);

        return ret(errorModel, errorCmd);
    }
};
