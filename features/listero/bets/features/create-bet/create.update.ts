import { match } from 'ts-pattern';
import { Model as GlobalModel } from '../../core/model';
import { CreateMsgType, CreateMsg, Model } from './create.types';
import { GameTypeCodes } from '@/constants/Bet';
import { Return, singleton, ret } from '@/shared/core/return';
import { RemoteData } from '@/shared/core/remote.data';
import { Cmd } from '@/shared/core/cmd';

// Initial state for this submodule
export const initCreate = (model: GlobalModel): Return<GlobalModel, CreateMsg> => {
    return singleton({
        ...model,
        createSession: {
            ...model.createSession,
            submissionStatus: RemoteData.notAsked(),
        },
    });
};

// Helper functions for business logic
export const getMaxLength = (gameTypeCode: GameTypeCodes | null): number => {
    switch (gameTypeCode) {
        case 'fijo':
        case 'parlet':
            return 2;
        case 'corrido':
            return 3;
        case 'centena':
            return 3;
        default:
            return 2;
    }
};

export const isValidBetNumbers = (numbers: string, gameTypeCode: GameTypeCodes | null): boolean => {
    if (!numbers || !gameTypeCode) return false;

    const maxLength = getMaxLength(gameTypeCode);

    if (numbers.length > maxLength) return false;

    // Basic validation - check if all characters are digits or X (for centena)
    const allowedChars = gameTypeCode === 'centena' ? /^[0-9X]+$/ : /^[0-9]+$/;
    return allowedChars.test(numbers);
};

const clearSessionData = (createSession: Model): Model => ({
    ...createSession,
    selectedDrawId: null,
    selectedGameType: null,
    numbersPlayed: '',
    amount: '',
    playerAlias: '',
    tempBets: [],
    submissionStatus: RemoteData.notAsked(),
});

export const updateCreate = (model: GlobalModel, msg: CreateMsg): Return<GlobalModel, CreateMsg> => {
    return match<CreateMsg, Return<GlobalModel, CreateMsg>>(msg)
        .with({ type: CreateMsgType.SET_CREATE_DRAW }, ({ drawId }) => {
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        selectedDrawId: drawId,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.SET_CREATE_GAME_TYPE }, ({ gameType }) => {
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        selectedGameType: gameType,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_NUMBERS }, ({ numbers }) => {
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        numbersPlayed: numbers,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_AMOUNT }, ({ amount }) => {
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        amount,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_PLAYER_ALIAS }, ({ alias }) => {
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        playerAlias: alias,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.ADD_BET_TO_CREATE_LIST }, () => {
            const { createSession } = model;
            if (!createSession.selectedGameType || !createSession.numbersPlayed || !createSession.amount) {
                return Return.val(model, Cmd.none);
            }

            const newBet = {
                gameType: createSession.selectedGameType,
                numbers: createSession.numbersPlayed,
                amount: parseFloat(createSession.amount) || 0,
            };

            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        tempBets: [...model.createSession.tempBets, newBet],
                        numbersPlayed: '',
                        amount: '',
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.REMOVE_BET_FROM_CREATE_LIST }, ({ index }) => {
            const newTempBets = [...model.createSession.tempBets];
            newTempBets.splice(index, 1);

            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        tempBets: newTempBets,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.CLEAR_CREATE_SESSION }, () => {
            return Return.val(
                {
                    ...model,
                    createSession: clearSessionData(model.createSession),
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.HANDLE_KEY_PRESS }, ({ key }) => {
            const { createSession } = model;
            const gameTypeCode = createSession.selectedGameType?.code?.toLowerCase() as GameTypeCodes | undefined;
            let newNumbers = createSession.numbersPlayed;

            if (key === 'delete') {
                newNumbers = createSession.numbersPlayed.slice(0, -1);
            } else {
                const maxLength = getMaxLength(gameTypeCode || null);

                if (createSession.numbersPlayed.length >= maxLength) {
                    return Return.val(model, Cmd.none);
                }

                if (key === 'X' && gameTypeCode !== 'centena') {
                    return Return.val(model, Cmd.none);
                }

                newNumbers = createSession.numbersPlayed + key;
            }

            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        numbersPlayed: newNumbers,
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.HANDLE_AMOUNT_SELECTION }, ({ value }) => {
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        amount: value.toString(),
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.VALIDATE_AND_ADD_BET }, ({ drawId }) => {
            const { createSession } = model;

            if (!drawId) {
                return Return.val(model, Cmd.none);
            }

            const gameTypeCode = createSession.selectedGameType?.code?.toLowerCase() as GameTypeCodes | undefined;

            if (!isValidBetNumbers(createSession.numbersPlayed, gameTypeCode || null)) {
                return Return.val(model, Cmd.none);
            }

            if (!createSession.amount || parseInt(createSession.amount) <= 0) {
                return Return.val(model, Cmd.none);
            }

            const newBet = {
                gameType: createSession.selectedGameType!,
                numbers: createSession.numbersPlayed,
                amount: parseFloat(createSession.amount) || 0,
            };

            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        tempBets: [...model.createSession.tempBets, newBet],
                        numbersPlayed: '',
                        amount: '',
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.SUBMIT_CREATE_SESSION }, () => {
            const { createSession } = model;

            if (createSession.tempBets.length === 0) {
                return Return.val(model, Cmd.none);
            }

            // Simulate TEA-style command for submission
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
                        // This would be an actual API call in a real scenario
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return { success: true };
                    },
                    onSuccess: (result) => ({ type: CreateMsgType.SUBMISSION_RESULT, result }),
                    onFailure: (error) => ({ type: CreateMsgType.SUBMISSION_RESULT, result: { success: false, error } }),
                })
            );
        })
        .with({ type: CreateMsgType.SUBMISSION_RESULT }, ({ result }) => {
            if (result.success) {
                return Return.val(
                    {
                        ...model,
                        createSession: clearSessionData(model.createSession),
                    },
                    Cmd.none
                );
            }
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        submissionStatus: RemoteData.failure(result.error || 'Unknown error'),
                    },
                },
                Cmd.none
            );
        })
        .with({ type: CreateMsgType.CONFIRM_CLEAR_BETS }, () => {
            return Return.val(
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        tempBets: [],
                    },
                },
                Cmd.none
            );
        })
        .exhaustive();
};
