import { useCallback } from 'react';
import { GameType } from '@/types';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { CreateMsgType } from './create.types';

/**
 * ViewModel hook para gestionar la creación de apuestas.
 */
export const useCreate = (drawId: string) => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const {
        createSession,
    } = model;

    const {
        selectedGameType,
        numbersPlayed,
        amount,
        playerAlias,
        tempBets,
        submissionStatus,
    } = createSession;

    // Actions
    const setGameType = useCallback((gameType: GameType) => {
        dispatch({
            type: 'CREATE',
            payload: { type: CreateMsgType.SET_CREATE_GAME_TYPE, gameType }
        });
    }, [dispatch]);

    const handleKeyPress = useCallback((key: string) => {
        dispatch({
            type: 'CREATE',
            payload: { type: CreateMsgType.HANDLE_KEY_PRESS, key }
        });
    }, [dispatch]);

    const handleAmountSelection = useCallback((value: number) => {
        dispatch({
            type: 'CREATE',
            payload: { type: CreateMsgType.HANDLE_AMOUNT_SELECTION, value }
        });
    }, [dispatch]);

    const updatePlayerAlias = useCallback((alias: string) => {
        dispatch({
            type: 'CREATE',
            payload: { type: CreateMsgType.UPDATE_CREATE_PLAYER_ALIAS, alias }
        });
    }, [dispatch]);

    const validateAndAddBet = useCallback(() => {
        dispatch({
            type: 'CREATE',
            payload: { type: CreateMsgType.VALIDATE_AND_ADD_BET, drawId }
        });
    }, [dispatch, drawId]);

    const submitSession = useCallback(() => {
        dispatch({
            type: 'CREATE',
            payload: { type: CreateMsgType.SUBMIT_CREATE_SESSION }
        });
    }, [dispatch]);

    const confirmClearBets = useCallback(() => {
        dispatch({
            type: 'CREATE',
            payload: { type: CreateMsgType.REQUEST_CLEAR_BETS }
        });
    }, [dispatch]);

    return {
        // State
        selectedGameType,
        numbersPlayed,
        amount,
        playerAlias,
        tempBets,
        submissionStatus,
        // Actions
        setGameType,
        handleKeyPress,
        handleAmountSelection,
        updatePlayerAlias,
        validateAndAddBet,
        submitSession,
        confirmClearBets,
    };
};
