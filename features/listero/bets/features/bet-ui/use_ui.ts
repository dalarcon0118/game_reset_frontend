import { useCallback } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { UiMsgType } from './ui.types';
import { GameType } from '@/types';

export const useUi = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const setActiveAnnotationType = useCallback((annotationType: string | null) => {
        dispatch({ type: 'UI', payload: { type: UiMsgType.SET_ACTIVE_ANNOTATION_TYPE, annotationType } });
    }, [dispatch]);

    const setActiveGameType = useCallback((gameType: GameType | null) => {
        dispatch({ type: 'UI', payload: { type: UiMsgType.SET_ACTIVE_GAME_TYPE, gameType } });
    }, [dispatch]);

    const clearError = useCallback(() => {
        dispatch({ type: 'UI', payload: { type: UiMsgType.CLEAR_ERROR } });
    }, [dispatch]);

    const closeAllDrawers = useCallback(() => {
        dispatch({ type: 'UI', payload: { type: UiMsgType.CLOSE_ALL_DRAWERS } });
    }, [dispatch]);

    return {
        error: model.error,
        activeAnnotationType: model.parletSession.activeAnnotationType,
        activeGameType: model.parletSession.activeGameType,
        setActiveAnnotationType,
        setActiveGameType,
        clearError,
        closeAllDrawers,
    };
};
