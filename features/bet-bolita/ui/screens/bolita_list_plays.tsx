import React, { useEffect } from 'react';
import { match, P } from 'ts-pattern';
import { useBolitaListViewModel } from '../hooks/useBolitaListViewModel';
import { NotAskedView, LoadingView, FailureView } from '../components/BolitaListStates';
import { SuccessView } from '../components/BolitaListSuccessView';
import logger from '@/shared/utils/logger';

interface BolitaListPlaysProps {
    drawId?: string;
}
const log = logger.withTag('BolitaListPlays');

export const BolitaListPlays: React.FC<BolitaListPlaysProps> = ({ drawId }) => {
    const { 
        remoteData, 
        groupedBets, 
        isRefreshing, 
        totals, 
        handleRefresh, 
        handleViewReceipt 
    } = useBolitaListViewModel(drawId);

    return match(remoteData)
        .with({ type: 'NotAsked' }, () => <NotAskedView />)
        .with({ type: 'Loading' }, () => <LoadingView />)
        .with({ type: 'Failure', error: P.select() }, (error) => <FailureView error={error as string} />)
        .otherwise(() => (
            <SuccessView
                groupedBets={groupedBets}
                totals={totals}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                onViewReceipt={handleViewReceipt}
            />
        ));
};

export default BolitaListPlays;
