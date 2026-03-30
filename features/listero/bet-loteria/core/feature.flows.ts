import { match } from 'ts-pattern';
import { okAsync, ResultAsync, err } from 'neverthrow';
import { LoteriaFeatureModel, FeatureMsg } from './feature.types';
import { Return, ret, Cmd, WebData, RemoteData, RemoteDataHttp } from '@core/tea-utils';
import { LoteriaDomain } from './feature.domain';
import { LoteriaBet, GameType } from '@/types';
import { initialModel } from './feature.initial';
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
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { BetQuery } from '@/shared/repositories/bet/bet.query';
import { drawRepository } from '@/shared/repositories/draw';
import { logger } from '@/shared/utils/logger';
import { BET_TYPE_KEYS, isLoteriaType } from '@/shared/types/bet_types';
import { BetType } from '@/types';
import { CalculationLogic } from './domain/calculation.logic';

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
                betTypes: RemoteData.loading()
            },
            listSession: {
                ...baseState.listSession,
                remoteData: RemoteData.loading()
            }
        };

        // ESTRATEGIA: Carga en Paralelo con Prioridad de Disco
        // 1. CARGA INMEDIATA (Disco): Las apuestas existentes se piden sin esperar a la red.
        const localCmd = !isEditing ? FeatureFlows.fetchExistingBets(drawId, null) : Cmd.none;

        // 2. CARGA DE METADATOS (Red/Caché): Sorteo y tipos de apuesta.
        const networkCmds = Cmd.batch([
            FeatureFlows.fetchDrawDetails(drawId),
            FeatureFlows.fetchBetTypes(drawId),
        ]);

        return ret(
            loadingModel,
            Cmd.batch([localCmd, networkCmds])
        );
    },

    refreshBets: (model: LoteriaFeatureModel, drawId: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        return ret(
            { ...model, listSession: { ...model.listSession, isRefreshing: true } },
            FeatureFlows.fetchExistingBets(drawId, null)
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
            () => {
                return ResultAsync.fromPromise(
                    drawRepository.getBetTypes(drawId),
                    (e) => e instanceof Error ? e : new Error(String(e))
                )
                    .andThen(result => result) // drawRepository returns Result
                    .map((types) => {
                        return types.map((t): GameType => ({
                            id: String(t.id),
                            name: t.name,
                            code: t.code || '',
                            description: t.description || ''
                        }));
                    })
                    .match(
                        (data) => {
                            log.debug('FETCH_BET_TYPES_SUCCESS', { drawId, count: data.length });
                            return data;
                        },
                        (error) => {
                            log.error('FETCH_BET_TYPES_ERROR', { drawId, error: error.message });
                            throw error;
                        }
                    );
            },
            (response) => ({ type: 'FETCH_BET_TYPES_RESPONSE', response })
        );
    },

    fetchExistingBets: (drawId: string, betTypeId?: string | null): Cmd => {
        log.debug('FETCH_EXISTING_BETS', { drawId, betTypeId });
        return RemoteDataHttp.fetch<LoteriaBet[], FeatureMsg>(
            async () => {
                // Filtrar solo por drawId (sin filtro de fecha)
                const query = BetQuery.create()
                    .forDraw(drawId)
                    .build();

                const betsResult = await betRepository.getBets(query);

                if (betsResult.isErr()) {
                    throw betsResult.error;
                }

                const bets = betsResult.value;
                log.info(`[LOTERIA_FLOW] Fetching bets for Draw: ${drawId}`, { filterDate: query.date });

                const mapped = bets
                    .filter((b: BetType) => {
                        const isLoteria = isLoteriaType(b.type || '', b.betTypeId);
                        if (betTypeId) {
                            return String(b.betTypeId) === String(betTypeId);
                        }
                        return isLoteria;
                    })
                    .map((b: BetType) => ({
                        id: b.id,
                        bet: b.numbers,
                        amount: b.amount,
                        receiptCode: b.receiptCode,
                        betTypeid: b.betTypeId,
                        drawid: String(b.drawId || '')
                    })) as unknown as LoteriaBet[];

                return mapped;
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
        // 1. Generación Determinista del receiptCode (Estrategia Elm: Garantía por Construcción)
        const receiptCode = CalculationLogic.generateReceiptCode();

        // 2. Set Loading State con el código ya inyectado
        const loadingModel = {
            ...model,
            summary: { 
                ...model.summary, 
                isSaving: true, 
                error: null,
                pendingReceiptCode: receiptCode
            }
        };

        // 3. Create HTTP Command con el receiptCode en el payload del mensaje de respuesta
        const saveCmd = RemoteDataHttp.fetch<BetType[], FeatureMsg>(
            () => {
                return okAsync(model)
                    .andThen((m) => {
                        const payloadResult = LoteriaDomain.createSavePayload(m, drawId);
                        return payloadResult.isErr()
                            ? err(payloadResult.error)
                            : okAsync(payloadResult.value);
                    })
                    .andThen((payload) => {
                        // Inyectamos el receiptCode en cada apuesta del lote si el repo lo permite
                        // o lo usamos como referencia para el guardado offline.
                        const payloadWithCode = payload.map(p => ({ ...p, receiptCode }));
                        
                        return ResultAsync.fromPromise(
                            betRepository.placeBatch(payloadWithCode).then((result) => {
                                if (result.isErr()) {
                                    throw result.error;
                                }
                                return result.value;
                            }),
                            (e) => e instanceof Error ? e : new Error(String(e))
                        );
                    })
                    .match(
                        (data) => data,
                        (error) => {
                            log.error('SAVE_BETS_ERROR', { drawId, error: error.message });
                            throw error;
                        }
                    );
            },
            (response: WebData<BetType[]>) => LoteriaFeatMsg(SAVE_BETS_RESPONSE({ response, drawId, receiptCode }))
        );

        return ret(loadingModel, saveCmd);
    },

    handleSaveResponse: (model: LoteriaFeatureModel, response: WebData<BetType[]>, drawId: string, receiptCode: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        return match(response)
            .with({ type: 'Failure' }, ({ error }) => FeatureFlows.finalizeSaveFailure(model, error))
            .with({ type: 'Success' }, ({ data }) => FeatureFlows.finalizeSaveSuccess(model, data, drawId, receiptCode))
            .otherwise(() => ret(model, Cmd.none));
    },

    finalizeSaveSuccess: (model: LoteriaFeatureModel, bets: any[] = [], drawIdFromMsg?: string, receiptCodeFromMsg?: string): Return<LoteriaFeatureModel, FeatureMsg> => {
        
        // ESTRATEGIA ELM: El dato del Mensaje (inyectado en el fetch) es la ÚNICA fuente de verdad.
        // Ignoramos el modelo (que puede estar sucio) y la respuesta (que puede venir vacía en offline).
        const receiptCode = receiptCodeFromMsg || (bets && bets.length > 0 && bets[0]?.receiptCode);
        const drawId = drawIdFromMsg || model.currentDrawId;

        log.info('FINALIZE_SAVE_SUCCESS: Preparando navegación', { 
            receiptCode, 
            drawId, 
            hasBets: bets?.length > 0,
            source: receiptCodeFromMsg ? 'MSG_INJECTED' : 'BETS_DATA'
        });

        // 1. Validación Crítica: Si no tenemos receiptCode o drawId, no podemos navegar con éxito al voucher
        if (!receiptCode || !drawId) {
            const error = `Error de navegación: receiptCode=${receiptCode}, drawId=${drawId}`;
            log.error('FINALIZE_SAVE_SUCCESS_ERROR', { receiptCode, drawId, betsCount: bets?.length });
            return FeatureFlows.finalizeSaveFailure(model, error);
        }

        // 2. Side Effect: Navegación con parámetros explícitos y Notificación de Éxito
        const navigationCmd = Cmd.batch([
            Cmd.navigate({
                pathname: '/lister/bet_success',
                params: { receiptCode, drawId }
            }),
            Cmd.ofMsg(LoteriaFeatMsg(SAVE_SUCCESS()))
        ]);

        // 3. Update State (Clear bets, success message) - El dominio limpia la lista
        const successModel = LoteriaDomain.handleSaveSuccess(model);

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
