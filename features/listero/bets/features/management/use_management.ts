import { useCallback, useMemo } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { ManagementMsgType } from './management.types';
import { RemoteData } from '@/shared/core/remote.data';

export const useManagement = (drawId: string) => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { managementSession } = model;
    const { betTypes, saveStatus, saveSuccess } = managementSession;

    // Derive flags from saveStatus for backward compatibility or easier UI usage
    const isSaving = useMemo(() => RemoteData.isLoading(saveStatus), [saveStatus]);
    const error = useMemo(() => {
        if (RemoteData.isFailure(saveStatus)) {
            return (saveStatus as any).error?.message || 'Error al guardar';
        }
        return null;
    }, [saveStatus]);

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
        saveStatus,
        error,
        fetchBetTypes,
        saveBets,
        resetBets,
        clearError,
    };
};
