import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useBetsStore, selectBetsModel, selectDispatch } from '../core/store';
import { ManagementMsgType } from '../management/management.types';
import { renderGameComponent, getGameListComponent } from './registry';
import { RemoteData } from '@/shared/core/remote.data';

interface GameLoaderProps {
    drawId: string;
    title?: string;
    mode: 'entry' | 'list';
}

export const GameLoader: React.FC<GameLoaderProps> = ({ drawId, title, mode }) => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);
    const { drawDetails } = model.managementSession;

    useEffect(() => {
        // Initialize management state for the draw
        dispatch({ 
            type: 'MANAGEMENT',
            payload: {
                type: ManagementMsgType.INIT, 
                drawId, 
                fetchExistingBets: mode === 'list', // Fetch bets only in list mode
                isEditing: mode === 'entry' // Entry mode implies editing/creating
            }
        });
    }, [drawId, dispatch, mode]);

    return RemoteData.fold(
        {
            notAsked: () => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                </View>
            ),
            loading: () => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                </View>
            ),
            failure: (error) => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Error loading draw: {typeof error === 'string' ? error : JSON.stringify(error)}</Text>
                </View>
            ),
            success: (data) => {
                 // Access draw type code safely
                 const gameTypeCode = data.draw_type_details?.code || 'UNKNOWN';
                 
                 if (mode === 'entry') {
                     return renderGameComponent(gameTypeCode, { drawId, title });
                 } else {
                     const ListComponent = getGameListComponent(gameTypeCode);
                     if (ListComponent) {
                         return <ListComponent drawId={drawId} title={title} />;
                     }
                     return (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>No list component for {gameTypeCode}</Text>
                        </View>
                     );
                 }
            }
        },
        drawDetails
    );
};
