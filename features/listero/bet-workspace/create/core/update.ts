import { match } from 'ts-pattern';
import { CreateMsgType, CreateMsg, Model as CreateModel } from './types';
import { GameTypeCodes } from '@/constants/bet';
import { Return, singleton, ret, RemoteData, Cmd } from '@core/tea-utils';
import { DrawService } from '@/shared/services/draw';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { GameRegistry } from '@/shared/core/registry/game_registry';
import { BetMapper, BetPlacementCandidate } from '@/shared/repositories/bet/bet.mapper';
import { User } from '@/shared/repositories/auth/types/types';
import logger from '@/shared/utils/logger';

const log = logger.withTag('CREATE_BET');

export interface CreateContextModel {
    createSession: CreateModel;
    host: {
        user: User | null;
        isAuthenticated: boolean;
    };
}

// Initial state for this submodule
export const initCreate = <M extends CreateContextModel>(model: M): Return<M, CreateMsg> => {
    return singleton({
        ...model,
        createSession: {
            ...model.createSession,
            submissionStatus: RemoteData.notAsked(),
            draw: RemoteData.notAsked(),
            gameTypes: RemoteData.notAsked(),
        },
    });
};

// Helper functions for business logic
export const getMaxLength = (gameTypeCode: GameTypeCodes | string | null): number => {
    if (!gameTypeCode) return 2;
    return GameRegistry.getMaxLength(gameTypeCode);
};

export const isValidBetNumbers = (numbers: string, gameTypeCode: GameTypeCodes | string | null): boolean => {
    if (!numbers || !gameTypeCode) return false;
    return GameRegistry.isValidInput(numbers, gameTypeCode);
};

const clearSessionData = (createSession: CreateModel): CreateModel => ({
    ...createSession,
    selectedDrawId: null,
    draw: RemoteData.notAsked(),
    gameTypes: RemoteData.notAsked(),
    selectedGameType: null,
    numbersPlayed: '',
    amount: '',
    playerAlias: '',
    tempBets: [],
    submissionStatus: RemoteData.notAsked(),
});

export const updateCreate = <M extends CreateContextModel>(model: M, msg: CreateMsg): Return<M, CreateMsg> => {
    return match<CreateMsg, Return<M, CreateMsg>>(msg)
        .with({ type: CreateMsgType.LOAD_INITIAL_DATA }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        selectedDrawId: drawId,
                        draw: RemoteData.loading(),
                        gameTypes: RemoteData.loading(),
                    },
                },
                Cmd.batch([
                    Cmd.task({
                        task: async () => await DrawService.getOne(drawId),
                        onSuccess: (draw) => draw
                            ? { type: CreateMsgType.SET_DRAW_DATA, data: RemoteData.success(draw) }
                            : { type: CreateMsgType.SET_DRAW_DATA, data: RemoteData.failure('Sorteo no encontrado') },
                        onFailure: (error) => ({ type: CreateMsgType.SET_DRAW_DATA, data: RemoteData.failure(error.message || 'Error desconocido') })
                    }),
                    Cmd.task({
                        task: async () => await DrawService.filterBetsTypeByDrawId(drawId),
                        onSuccess: (gameTypes) => ({ type: CreateMsgType.SET_GAME_TYPES_DATA, data: RemoteData.success(gameTypes) }),
                        onFailure: (error) => ({ type: CreateMsgType.SET_GAME_TYPES_DATA, data: RemoteData.failure(error.message || 'Error desconocido') })
                    })
                ])
            );
        })
        .with({ type: CreateMsgType.SET_DRAW_DATA }, ({ data }) => {
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    draw: data,
                },
            });
        })
        .with({ type: CreateMsgType.SET_GAME_TYPES_DATA }, ({ data }) => {
            const selectedGameType = data.type === 'Success' ? data.data[0] : model.createSession.selectedGameType;
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    gameTypes: data,
                    selectedGameType: selectedGameType,
                },
            });
        })
        .with({ type: CreateMsgType.SET_CREATE_DRAW }, ({ drawId }) => {
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    selectedDrawId: drawId,
                },
            });
        })
        .with({ type: CreateMsgType.SET_CREATE_GAME_TYPE }, ({ gameType }) => {
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    selectedGameType: gameType,
                    numbersPlayed: '', // Reset numbers when game type changes
                },
            });
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_NUMBERS }, ({ numbers }) => {
            const maxLength = getMaxLength(model.createSession.selectedGameType?.code || null);
            if (numbers.length > maxLength) return singleton(model);

            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    numbersPlayed: numbers,
                },
            });
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_AMOUNT }, ({ amount }) => {
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    amount: amount,
                },
            });
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_PLAYER_ALIAS }, ({ alias }) => {
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    playerAlias: alias,
                },
            });
        })
        .with({ type: CreateMsgType.ADD_BET_TO_CREATE_LIST }, () => {
            const { selectedGameType, numbersPlayed, amount } = model.createSession;
            if (!selectedGameType || !numbersPlayed || !amount) return singleton(model);

            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) return singleton(model);

            if (!isValidBetNumbers(numbersPlayed, selectedGameType.code)) return singleton(model);

            const newBet = {
                gameType: selectedGameType,
                numbers: numbersPlayed,
                amount: amountNum,
            };

            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    tempBets: [...model.createSession.tempBets, newBet],
                    numbersPlayed: '', // Clear numbers after adding
                },
            });
        })
        .with({ type: CreateMsgType.REMOVE_BET_FROM_CREATE_LIST }, ({ index }) => {
            const newTempBets = [...model.createSession.tempBets];
            newTempBets.splice(index, 1);

            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    tempBets: newTempBets,
                },
            });
        })
        .with({ type: CreateMsgType.CLEAR_CREATE_SESSION }, () => {
            return singleton({
                ...model,
                createSession: clearSessionData(model.createSession),
            });
        })
        .with({ type: CreateMsgType.HANDLE_KEY_PRESS }, ({ key }) => {
            if (key === 'DEL') {
                return singleton({
                    ...model,
                    createSession: {
                        ...model.createSession,
                        numbersPlayed: model.createSession.numbersPlayed.slice(0, -1),
                    },
                });
            }

            const maxLength = getMaxLength(model.createSession.selectedGameType?.code || null);
            if (model.createSession.numbersPlayed.length >= maxLength) return singleton(model);

            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    numbersPlayed: model.createSession.numbersPlayed + key,
                },
            });
        })
        .with({ type: CreateMsgType.HANDLE_AMOUNT_SELECTION }, ({ value }) => {
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    amount: value.toString(),
                },
            });
        })
        .with({ type: CreateMsgType.VALIDATE_AND_ADD_BET }, ({ drawId }) => {
            // This is a more complex message that might trigger side effects or multiple model updates
            // For now, let's keep it simple and just delegate to ADD_BET_TO_CREATE_LIST
            return updateCreate(model, { type: CreateMsgType.ADD_BET_TO_CREATE_LIST });
        })
        .with({ type: CreateMsgType.SUBMIT_CREATE_SESSION }, () => {
            if (model.createSession.tempBets.length === 0) return singleton(model);

            // Obtener el owner_structure del draw cargado (igual que en Lotería)
            const drawDetails = model.createSession.draw.type === 'Success'
                ? model.createSession.draw.data
                : null;
            const effectiveStructureId = drawDetails?.owner_structure
                ? String(drawDetails.owner_structure)
                : '';

            // Crear candidatos de apuesta con normalización centralizada
            // FASE 2: Ahora incluye betTypeCode para mayor estabilidad
            const candidates: BetPlacementCandidate[] = model.createSession.tempBets.map(b => ({
                drawId: model.createSession.selectedDrawId || '',
                betTypeId: b.gameType.id,
                betTypeCode: b.gameType.code, // FASE2: Código estable (FIJO, CORRIDO, etc.)
                type: b.gameType.code || b.gameType.name,
                numbers: b.numbers,
                amount: b.amount,
                ownerStructure: effectiveStructureId || '0'
            }));

            return ret(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        submissionStatus: RemoteData.loading(),
                    },
                },
                Cmd.task({
                    task: async () => {
                        // Usar el mapper para validar y normalizar el formato
                        // Obtenemos el ID del usuario del estado sincronizado del host
                        const ownerUser = model.host?.user?.id;
                        if (!ownerUser) {
                            log.error(`[CREATE_BET] ❌ Error: Intento de apuesta sin usuario sincronizado`);
                            throw new Error('HOST_USER_NOT_SYNCED');
                        }
                        const mappedResult = BetMapper.toPlacementBatch(candidates, ownerUser);
                        if (mappedResult.isErr()) {
                            throw mappedResult.error;
                        }
                        log.info(`[CREATE_BET] 🎯 Enviando apuestas normalizadas:`, mappedResult.value);
                        return await betRepository.placeBatch(mappedResult.value);
                    },
                    onSuccess: (result) => ({ type: CreateMsgType.SUBMISSION_RESULT, result: RemoteData.success(result) }),
                    onFailure: (error) => ({ type: CreateMsgType.SUBMISSION_RESULT, result: RemoteData.failure(error.message || 'Error al enviar apuestas') })
                })
            );
        })
        .with({ type: CreateMsgType.SUBMISSION_RESULT }, ({ result }) => {
            if (result.type === 'Success') {
                return singleton({
                    ...model,
                    createSession: clearSessionData(model.createSession),
                });
            }
            return singleton({
                ...model,
                createSession: {
                    ...model.createSession,
                    submissionStatus: result,
                },
            });
        })
        //add with error msg
        .with({ type: CreateMsgType.HANDLE_ERROR }, ({ error }) => {
            log.error(`[CREATE_WORKSPACE] ❌ Error: ${error}`, model,);
            return singleton(model);
        })
        .otherwise(() => {
            log.debug(`[CREATE_WORKSPACE] 🔄 Sin manejar el mensaje: ${msg.type}`, model,);
            return singleton(model);
        });
};
