import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { useBolitaDispatch, useBolitaModel } from '../store';
import { BolitaListData } from '../../domain/models/bolita.types';
import { ListMsgType, LIST } from '../../domain/models/bolita.messages';
import { groupBetsByReceipt, GroupedBets } from '../utils/list_grouping';
import { logger } from '@/shared/utils/logger';
import { RemoteData, WebData } from '@core/tea-utils';

const log = logger.withTag('BolitaListProvider');

export interface BolitaListContextType {
    remoteData: WebData<BolitaListData>;
    groupedBets: GroupedBets;
    isRefreshing: boolean;
    totals: {
        fijosCorridosTotal: number;
        parletsTotal: number;
        centenasTotal: number;
        grandTotal: number;
    };
    handleRefresh: () => void;
    handleViewReceipt: (receiptCode: string) => void;
}

const BolitaListContext = createContext<BolitaListContextType | undefined>(undefined);

interface BolitaListProviderProps {
    drawId?: string;
    children: React.ReactNode;
}

export const BolitaListProvider: React.FC<BolitaListProviderProps> = ({ drawId, children }) => {
    const model = useBolitaModel();
    const dispatch = useBolitaDispatch();

    const { isRefreshing, remoteData, summary } = model.listState;
    const { fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal } = summary;
    
    useEffect(() => {
        log.debug('BolitaListProvider - totals', { fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal });
    }, [fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal]);

    // Fetch Logic
    const fetchBets = useCallback((type: ListMsgType.FETCH_BETS_REQUESTED | ListMsgType.REFRESH_BETS_REQUESTED) => {
        if (!drawId) {
            log.warn('Attempted to fetch bets without drawId');
            return;
        }
        dispatch(LIST({
            type,
            drawId
        }));
    }, [drawId, dispatch]);

    const handleRefresh = useCallback(() => {
        fetchBets(ListMsgType.REFRESH_BETS_REQUESTED);
    }, [fetchBets]);

    // Initial Load Effect
    useEffect(() => {
        if (!drawId) {
            log.warn('Provider mounted without drawId - skipping fetch');
            return;
        }

        // Dispatch the fetch - the store will handle retry if feature isn't ready yet
        log.debug('Fetching bets for draw', { drawId });
        fetchBets(ListMsgType.FETCH_BETS_REQUESTED);

    }, [drawId, fetchBets]);


    const groupedBets = useMemo(() => {
        if (!RemoteData.isSuccess(remoteData)) {
            return {};
        }
        const { fijosCorridos, parlets, centenas } = remoteData.data;
        return groupBetsByReceipt(fijosCorridos, parlets, centenas);
    }, [remoteData]);

    const handleViewReceipt = useCallback((receiptCode: string) => {
        if (!drawId) {
            log.warn('Cannot view receipt: missing drawId');
            return;
        }

        const params: Record<string, string> = { drawId };
        if (receiptCode && receiptCode !== '-----') {
            params.receiptCode = receiptCode;
        }

        router.push({ pathname: '/lister/bet_success', params });
    }, [drawId]);

    const value = useMemo(() => ({
        remoteData,
        groupedBets,
        isRefreshing: !!isRefreshing,
        totals: {
            fijosCorridosTotal,
            parletsTotal,
            centenasTotal,
            grandTotal,
        },
        handleRefresh,
        handleViewReceipt,
    }), [
        remoteData,
        groupedBets,
        isRefreshing,
        fijosCorridosTotal,
        parletsTotal,
        centenasTotal,
        grandTotal,
        handleRefresh,
        handleViewReceipt
    ]);

    return (
        <BolitaListContext.Provider value={value}>
            {children}
        </BolitaListContext.Provider>
    );
};

export const useBolitaListContext = () => {
    const context = useContext(BolitaListContext);
    if (context === undefined) {
        throw new Error('useBolitaListContext must be used within a BolitaListProvider');
    }
    return context;
};
