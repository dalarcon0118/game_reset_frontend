import { useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { useBetsStore, selectBetsModel, selectDispatch } from '@/features/listero/bets/core/store';
import { ListMsgType } from '@/features/listero/bets/features/bet-list/list.types';
import { groupBetsByReceipt, GroupedBets } from '../utils/list_grouping';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('useBolitaListViewModel');

interface BolitaListViewModelResult {
    remoteData: any;
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

export const useBolitaListViewModel = (drawId?: string): BolitaListViewModelResult => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal } = model.summary;
    const { isRefreshing } = model.listSession;
    const remoteData = model.listSession.remoteData as any;
    useEffect(() => {
        log.debug('useBolitaListViewModel - totals', { fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal });
    }, [fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal])
    const handleRefresh = useCallback(() => {
        if (drawId) {
            dispatch({
                type: 'LIST',
                payload: {
                    type: ListMsgType.REFRESH_BETS_REQUESTED,
                    drawId
                }
            });
        }
    }, [drawId, dispatch]);

    // Data transformation logic
    const fijosCorridos = remoteData.type === 'Success' ? (remoteData.data.fijosCorridos || []) : [];
    const parlets = remoteData.type === 'Success' ? (remoteData.data.parlets || []) : [];
    const centenas = remoteData.type === 'Success' ? (remoteData.data.centenas || []) : [];

    const groupedBets = useMemo(() => {
        if (remoteData.type !== 'Success') return {};
        return groupBetsByReceipt(fijosCorridos, parlets, centenas);
    }, [remoteData.type, fijosCorridos, parlets, centenas]);

    const handleViewReceipt = useCallback((receiptCode: string) => {
        const params: any = {};
        if (drawId) params.drawId = drawId;
        if (receiptCode && receiptCode !== '-----') params.receiptCode = receiptCode;

        router.push({ pathname: '/lister/bet_success', params });
    }, [drawId]);

    return {
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
    };
};
