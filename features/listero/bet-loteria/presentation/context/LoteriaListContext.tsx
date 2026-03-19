import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import { useLoteriaStore, useLoteriaDispatch, useLoteriaModel, selectLoteriaModel, selectDispatch } from '../../core/store';
import { selectLoteriaList, selectFixedAmount, selectDrawDetails } from '../../use_loteria_selectors';
import { groupBetsByReceipt } from '../../components/loteria/loteria_column.impl';
import { LoteriaGroup } from '../../components/loteria/loteria_column.types';
import { LoteriaFeatMsg, INIT, REFRESH_BETS } from '../../loteria/loteria.types';
import { WebData } from '@core/tea-utils';
import { LoteriaBet } from '@/types';
import { useAuth } from '@features/auth';

export interface LoteriaListContextType {
    remoteData: WebData<{ loteria: LoteriaBet[] }>;
    groupedBets: LoteriaGroup[];
    isRefreshing: boolean;
    loteriaTotal: number;
    drawDetails: any;
    handleRefresh: () => void;
    handleViewReceipt: (receiptCode: string) => void;
}

const LoteriaListContext = createContext<LoteriaListContextType | undefined>(undefined);

interface LoteriaListProviderProps {
    drawId?: string;
    children: React.ReactNode;
}

export const LoteriaListProvider: React.FC<LoteriaListProviderProps> = ({ drawId, children }) => {
    const model = useLoteriaModel();
    const dispatch = useLoteriaDispatch();
    const { user } = useAuth();

    const loteriaList = useMemo(() => selectLoteriaList(model), [model]);
    const drawDetails = useMemo(() => selectDrawDetails(model), [model]);
    
    const { isRefreshing, remoteData } = model.listSession;
    const { loteriaTotal } = model.summary;

    useEffect(() => {
        if (drawId) {
            dispatch(LoteriaFeatMsg(INIT({ 
                drawId, 
                isEditing: false, 
                structureId: user?.structure?.id ? String(user.structure.id) : undefined 
            })));
        }
    }, [drawId, dispatch, user?.structure?.id]);

    const handleRefresh = useCallback(() => {
        if (drawId) {
            dispatch(LoteriaFeatMsg(REFRESH_BETS({ drawId })));
        }
    }, [drawId, dispatch]);

    const groupedBets = useMemo(() => 
        groupBetsByReceipt(loteriaList, false), 
        [loteriaList]
    );

    const handleViewReceipt = useCallback((receiptCode: string) => {
        if (!receiptCode || receiptCode === '-----') return;

        router.push({
            pathname: '/lister/bet_success',
            params: {
                receiptCode,
                drawId: drawDetails?.id || drawId
            }
        });
    }, [router, drawDetails, drawId]);

    const value = useMemo(() => ({
        remoteData: remoteData as WebData<{ loteria: LoteriaBet[] }>,
        groupedBets,
        isRefreshing: !!isRefreshing,
        loteriaTotal,
        drawDetails,
        handleRefresh,
        handleViewReceipt,
    }), [
        remoteData,
        groupedBets,
        isRefreshing,
        loteriaTotal,
        drawDetails,
        handleRefresh,
        handleViewReceipt
    ]);

    return (
        <LoteriaListContext.Provider value={value}>
            {children}
        </LoteriaListContext.Provider>
    );
};

export const useLoteriaListContext = () => {
    const context = useContext(LoteriaListContext);
    if (context === undefined) {
        throw new Error('useLoteriaListContext must be used within a LoteriaListProvider');
    }
    return context;
};
