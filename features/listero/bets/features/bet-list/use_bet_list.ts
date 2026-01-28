import { useCallback } from 'react';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../core/store';
import { ListMsgType } from './list.types';

export const useBetList = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { listSession } = model;

    const fetchBets = useCallback((drawId: string) => {
        dispatch({ type: 'LIST', payload: { type: ListMsgType.FETCH_BETS_REQUESTED, drawId } });
    }, [dispatch]);

    const removeBet = useCallback((betId: string, category: 'fijosCorridos' | 'parlets' | 'centenas') => {
        dispatch({ type: 'LIST', payload: { type: ListMsgType.REMOVE_BET, betId, category } });
    }, [dispatch]);

    const clearList = useCallback(() => {
        dispatch({ type: 'LIST', payload: { type: ListMsgType.CLEAR_LIST } });
    }, [dispatch]);

    const updateFilter = useCallback((filter: string) => {
        dispatch({ type: 'LIST', payload: { type: ListMsgType.UPDATE_LIST_FILTER, filter } });
    }, [dispatch]);

    return {
        fijosCorridos: listSession.fijosCorridos,
        parlets: listSession.parlets,
        centenas: listSession.centenas,
        isLoading: listSession.isLoading,
        error: listSession.error,
        aliasFilter: listSession.aliasFilter,
        fetchBets,
        removeBet,
        clearList,
        updateFilter,
    };
};
