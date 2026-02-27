import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { match } from 'ts-pattern';
import { useBolitaListContext, BolitaListProvider } from '../context/BolitaListContext';
import { NotAskedView, LoadingView, FailureView } from '../components/BolitaListStates';
import { SuccessView } from '../components/BolitaListSuccessView';
import logger from '@/shared/utils/logger';
import { EmptyBetsView } from '@/shared/components/bets/empty';

const log = logger.withTag('BolitaListPlays');



interface BolitaListContentProps {
    drawId: string;
}

const BolitaListContent: React.FC<BolitaListContentProps> = ({ drawId }) => {
    const { 
        remoteData, 
        groupedBets, 
        isRefreshing, 
        totals, 
        handleRefresh, 
        handleViewReceipt 
    } = useBolitaListContext();
    
    useEffect(() => {
        log.info('BolitaListPlays mounted');
        log.info('remoteData', remoteData);
        log.info('groupedBets', groupedBets);
        log.info('isRefreshing', isRefreshing);
        log.info('totals', totals);
    }, [ remoteData, 
        groupedBets, 
        isRefreshing, 
        totals, 
        handleRefresh, 
        handleViewReceipt ]);


    return match(remoteData)
        .with({ type: 'NotAsked' }, () => <NotAskedView />)
        .with({ type: 'Loading' }, () => <LoadingView />)
        .with({ type: 'Failure' }, ({ error }) => <FailureView error={String(error)} />)
        .with({ type: 'Success' }, () => {
            const isEmpty = Object.keys(groupedBets).length === 0;
            if (isEmpty) {
                return (
                    <EmptyBetsView 
                        onAnotar={() => router.push({ pathname: '/lister/bets/bolita/anotate', params: { id: drawId } })} 
                        goToHome={() => router.push({ pathname: '/' })}
                    />
                );
            }

            return (
                <SuccessView
                    groupedBets={groupedBets}
                    totals={totals}
                    isRefreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    onViewReceipt={handleViewReceipt}
                />
            );
        })
        .otherwise(() => null);
};

interface BolitaListPlaysProps {
    drawId: string;
}

export const BolitaListPlays: React.FC<BolitaListPlaysProps> = ({ drawId }) => {
    return (
        <BolitaListProvider drawId={drawId}>
            <BolitaListContent drawId={drawId} />
        </BolitaListProvider>
    );
};



export default BolitaListPlays;
