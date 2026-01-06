import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { CreateMsgType, CreateMsg } from '../types/create.types';
import { Cmd } from '@/shared/core/cmd';
import { GameTypeCodes } from '@/constants/Bet';

// Helper functions for business logic
const getMaxLength = (gameTypeCode: GameTypeCodes | null): number => {
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

const isValidBetNumbers = (numbers: string, gameTypeCode: GameTypeCodes | null): boolean => {
    if (!numbers || !gameTypeCode) return false;

    const maxLength = getMaxLength(gameTypeCode);

    if (numbers.length > maxLength) return false;

    // Basic validation - check if all characters are digits or X (for centena)
    const allowedChars = gameTypeCode === 'centena' ? /^[0-9X]+$/ : /^[0-9]+$/;
    return allowedChars.test(numbers);
};

export const updateCreate = (model: Model, msg: CreateMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: CreateMsgType.SET_CREATE_DRAW }, ({ drawId }) => {
            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        selectedDrawId: drawId,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.SET_CREATE_GAME_TYPE }, ({ gameType }) => {
            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        selectedGameType: gameType,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_NUMBERS }, ({ numbers }) => {
            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        numbersPlayed: numbers,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.UPDATE_CREATE_AMOUNT }, ({ amount }) => {
            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        amount,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.ADD_BET_TO_CREATE_LIST }, () => {
            const { createSession } = model;
            if (!createSession.selectedGameType || !createSession.numbersPlayed || !createSession.amount) {
                return [model, Cmd.none] as [Model, Cmd];
            }

            const newBet = {
                gameType: createSession.selectedGameType,
                numbers: createSession.numbersPlayed,
                amount: parseFloat(createSession.amount) || 0,
            };

            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        tempBets: [...model.createSession.tempBets, newBet],
                        numbersPlayed: '',
                        amount: '',
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.REMOVE_BET_FROM_CREATE_LIST }, ({ index }) => {
            const newTempBets = [...model.createSession.tempBets];
            newTempBets.splice(index, 1);

            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        tempBets: newTempBets,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.CLEAR_CREATE_SESSION }, () => {
            return [
                {
                    ...model,
                    createSession: {
                        selectedDrawId: null,
                        selectedGameType: null,
                        numbersPlayed: '',
                        amount: '',
                        tempBets: [],
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
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
                    return [model, Cmd.none] as [Model, Cmd];
                }

                if (key === 'X' && gameTypeCode !== 'centena') {
                    return [model, Cmd.none] as [Model, Cmd];
                }

                newNumbers = createSession.numbersPlayed + key;
            }

            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        numbersPlayed: newNumbers,
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.HANDLE_AMOUNT_SELECTION }, ({ value }) => {
            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        amount: value.toString(),
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.VALIDATE_AND_ADD_BET }, ({ drawId }) => {
            const { createSession } = model;

            if (!drawId) {
                // Error: no draw selected - would trigger alert in component
                return [model, Cmd.none] as [Model, Cmd];
            }

            const gameTypeCode = createSession.selectedGameType?.code?.toLowerCase() as GameTypeCodes | undefined;

            if (!isValidBetNumbers(createSession.numbersPlayed, gameTypeCode || null)) {
                // Error: invalid numbers - would trigger alert in component
                return [model, Cmd.none] as [Model, Cmd];
            }

            if (!createSession.amount || parseInt(createSession.amount) <= 0) {
                // Error: invalid amount - would trigger alert in component
                return [model, Cmd.none] as [Model, Cmd];
            }

            // Valid bet - add it to the list
            const newBet = {
                gameType: createSession.selectedGameType!,
                numbers: createSession.numbersPlayed,
                amount: parseFloat(createSession.amount) || 0,
            };

            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        tempBets: [...model.createSession.tempBets, newBet],
                        numbersPlayed: '',
                        amount: '',
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.SUBMIT_CREATE_SESSION }, () => {
            const { createSession } = model;

            if (createSession.tempBets.length === 0) {
                if (createSession.numbersPlayed && createSession.amount) {
                    // Try to add current bet first
                    const gameTypeCode = createSession.selectedGameType?.code?.toLowerCase() as GameTypeCodes | undefined;

                    if (isValidBetNumbers(createSession.numbersPlayed, gameTypeCode || null) &&
                        createSession.amount && parseInt(createSession.amount) > 0) {

                        const newBet = {
                            gameType: createSession.selectedGameType!,
                            numbers: createSession.numbersPlayed,
                            amount: parseFloat(createSession.amount) || 0,
                        };

                        return [
                            {
                                ...model,
                                createSession: {
                                    ...model.createSession,
                                    tempBets: [...model.createSession.tempBets, newBet],
                                    numbersPlayed: '',
                                    amount: '',
                                },
                            },
                            Cmd.none,
                        ] as [Model, Cmd];
                    }
                }
                // No bets to submit - would trigger alert in component
                return [model, Cmd.none] as [Model, Cmd];
            }

            // Clear session after successful submission
            return [
                {
                    ...model,
                    createSession: {
                        selectedDrawId: null,
                        selectedGameType: null,
                        numbersPlayed: '',
                        amount: '',
                        tempBets: [],
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: CreateMsgType.CONFIRM_CLEAR_BETS }, () => {
            // Clear all bets in session
            return [
                {
                    ...model,
                    createSession: {
                        ...model.createSession,
                        numbersPlayed: '',
                        amount: '',
                        tempBets: [],
                    },
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
