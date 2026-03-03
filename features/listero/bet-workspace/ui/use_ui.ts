import { useCallback } from 'react';
import { useBetWorkspaceStore } from '../core/store';
import { UiMsgType } from './ui.types';
import { GameType } from '@/types';

export const useUi = () => {
    const model = useBetWorkspaceStore((state: any) => state.model);
    const dispatch = useBetWorkspaceStore((state: any) => state.dispatch);

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
        activeAnnotationType: model.centenaSession.activeAnnotationType,
        activeGameType: model.centenaSession.activeGameType,
        setActiveAnnotationType,
        setActiveGameType,
        clearError,
        closeAllDrawers,
    };
};
