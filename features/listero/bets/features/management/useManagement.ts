import { useCallback } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { ManagementMsgType } from './management.types';

export const useManagement = (drawId: string) => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { managementSession } = model;
    const { betTypes, isSaving, saveSuccess, error } = managementSession;

    const fetchBetTypes = useCallback(() => {
        dispatch({
            type: 'MANAGEMENT',
            payload: { type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED, drawId }
        });
    }, [dispatch, drawId]);

    const saveBets = useCallback(() => {
        dispatch({
            type: 'MANAGEMENT',
            payload: { type: ManagementMsgType.SAVE_BETS_REQUESTED, drawId }
        });
    }, [dispatch, drawId]);

    const resetBets = useCallback(() => {
        dispatch({
            type: 'MANAGEMENT',
            payload: { type: ManagementMsgType.RESET_BETS }
        });
    }, [dispatch]);

    const clearError = useCallback(() => {
        dispatch({
            type: 'MANAGEMENT',
            payload: { type: ManagementMsgType.CLEAR_MANAGEMENT_ERROR }
        });
    }, [dispatch]);

    return {
        betTypes,
        isSaving,
        saveSuccess,
        error,
        fetchBetTypes,
        saveBets,
        resetBets,
        clearError,
    };
};
