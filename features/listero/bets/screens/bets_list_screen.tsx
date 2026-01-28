import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View, ScrollView, ActivityIndicator, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Layout } from '@ui-kitten/components';
import { match } from 'ts-pattern';

import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';

import { useBetsStore, selectBetsModel, selectInit, selectDispatch } from '../core/store';
import { getGameListComponent } from '@/features/listero/games/registry';
import { ListMsgType } from '../features/bet-list/list.types';

interface BetsListScreenProps {
    drawId?: string;
    title?: string;
}

export const BetsListScreen = ({ drawId, title }: BetsListScreenProps) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;

    const model = useBetsStore(selectBetsModel);
    const init = useBetsStore(selectInit);
    const dispatch = useBetsStore(selectDispatch);

    const { isRefreshing } = model.listSession;
    console.log('BetsListScreen render: isRefreshing =', isRefreshing);
    console.log('BetsListScreen render: drawId from route =', drawId);
    console.log('BetsListScreen render: model.drawId =', model.drawId);
    console.log('BetsListScreen render: remoteData type =', model.listSession.remoteData.type);

    // Log the full remoteData for debugging
    if (model.listSession.remoteData.type === 'Success') {
        console.log('BetsListScreen render: SUCCESS data =', model.listSession.remoteData.data);
    } else if (model.listSession.remoteData.type === 'Failure') {
        console.log('BetsListScreen render: FAILURE error =', model.listSession.remoteData.error);
    }

    // Force fetch bets when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (drawId) {
                console.log('BetsListScreen: Force fetching bets for drawId =', drawId);
                init({ drawId, fetchExistingBets: true });
            }
        }, [drawId, init])
    );

    const handleRefresh = useCallback(() => {
        console.log('BetsListScreen: handleRefresh triggered, drawId =', drawId);
        if (drawId) {
            dispatch({
                type: 'LIST',
                payload: {
                    type: ListMsgType.REFRESH_BETS_REQUESTED,
                    drawId
                }
            });
        } else {
            console.log('BetsListScreen: handleRefresh ABORTED - no drawId');
        }
    }, [drawId, dispatch]);

    const renderContent = () => {
        // Wait for draw type info before deciding what to render
        if (model.drawTypeCode.type === 'Loading') {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                    <Text style={styles.loadingText}>Cargando información del sorteo...</Text>
                </View>
            );
        }

        if (model.drawTypeCode.type === 'Failure') {
            return (
                <View style={styles.centerContainer}>
                    <Text status="danger">Error cargando info del sorteo: {model.drawTypeCode.error}</Text>
                </View>
            );
        }

        return match(model.listSession.remoteData)
            .with({ type: 'NotAsked' }, () => null)
            .with({ type: 'Loading' }, () => (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                    <Text style={styles.loadingText}>Cargando apuestas...</Text>
                </View>
            ))
            .with({ type: 'Failure' }, ({ error }) => (
                <View style={styles.centerContainer}>
                    <Text status="danger">Error: {error}</Text>
                </View>
            ))
            .with({ type: 'Success' }, () => {
                const drawTypeCode = model.drawTypeCode.type === 'Success' 
                    ? model.drawTypeCode.data 
                    : 'BL';
                
                console.log('BetsListScreen Success: drawTypeCode =', drawTypeCode);
                const GameListComponent = getGameListComponent(drawTypeCode);

                if (GameListComponent) {
                    return <GameListComponent drawId={drawId} title={title} />;
                }

                return (
                    <View style={styles.centerContainer}>
                        <Text category='h6'>Tipo de sorteo no soportado</Text>
                        <Text appearance='hint'>{drawTypeCode}</Text>
                    </View>
                );
            })
            .exhaustive();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
            <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
                <Text category='h6' style={styles.title}>{title || ''} - {drawId || ''}</Text>
            </Layout>
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: LayoutConstants.spacing.lg,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    title: {
        textAlign: 'center',
        fontWeight: 'bold',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
    },
    footer: {
        padding: LayoutConstants.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        backgroundColor: '#FFFFFF',
    },
    totalsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: LayoutConstants.spacing.xs,
    },
    grandTotalContainer: {
        marginTop: LayoutConstants.spacing.xs,
        borderTopWidth: 2,
        borderTopColor: '#E8E8E8',
    },
});
