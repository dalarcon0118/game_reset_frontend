import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { BetWorkspaceProvider, useBetWorkspaceStore } from '../../core/store';
import { renderGameComponent, getGameListComponent } from './game_registry';
import { RemoteData } from '@core/tea-utils';

interface GameLoaderProps {
    drawId: string;
    title?: string;
    mode: 'entry' | 'list';
}

const GameLoaderContent: React.FC<GameLoaderProps> = ({ drawId, title, mode }) => {
    const model = useBetWorkspaceStore((state: any) => state.model);
    const { drawDetails } = model.managementSession;

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
            failure: (error: any) => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Error loading draw: {typeof error === 'string' ? error : JSON.stringify(error)}</Text>
                </View>
            ),
            success: (data: any) => {
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

export const GameLoader: React.FC<GameLoaderProps> = (props) => {
    return (
        <BetWorkspaceProvider initialParams={{ drawId: props.drawId, mode: props.mode, title: props.title }}>
            <GameLoaderContent {...props} />
        </BetWorkspaceProvider>
    );
};
