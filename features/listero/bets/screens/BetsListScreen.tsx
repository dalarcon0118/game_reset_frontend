import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View, ScrollView, ActivityIndicator, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Layout } from '@ui-kitten/components';
import { match } from 'ts-pattern';

import Colors from '@/constants/Colors';
import LayoutConstants from '@/constants/Layout';

import { useBetsStore, selectBetsModel, selectInit, selectDispatch } from '../core/store';
import { ColumnHeaders } from '../shared/components/ColumnHeaders';
import FijosCorridosColumn from '../features/fijos-corridos/components/FijosCorridosColumn';
import { ParletColumn } from '../features/parlet/components/ParletColumn';
import { CentenasColumn } from '../shared/components/CentenasColumn';
import { SumRowComponent } from '../shared/components/SumRowComponent';
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
            .with({ type: 'Success' }, ({ data }) => {
                const { fijosCorridos, parlets, centenas } = data;

                const fijosCorridosTotal = fijosCorridos.reduce((total, bet) => {
                    const fijoAmount = bet.fijoAmount || 0;
                    const corridoAmount = bet.corridoAmount || 0;
                    return total + fijoAmount + corridoAmount;
                }, 0);

                const parletsTotal = parlets.reduce((total, parlet) => {
                    if (parlet.bets && parlet.bets.length > 0 && parlet.amount) {
                        const numBets = parlet.bets.length;
                        const parletTotal = numBets * (numBets - 1) * parlet.amount;
                        return total + parletTotal;
                    }
                    return total;
                }, 0);

                const centenasTotal = centenas.reduce((total, centena) => {
                    return total + (centena.amount || 0);
                }, 0);

                const grandTotal = fijosCorridosTotal + parletsTotal + centenasTotal;

                return (
                    <View style={{ flex: 1 }}>
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{
                                flexGrow: 1,
                                minHeight: '101%',
                            }}
                            alwaysBounceVertical={true}
                            scrollEventThrottle={16}
                            refreshControl={
                                <RefreshControl
                                    refreshing={!!isRefreshing}
                                    onRefresh={() => {
                                        console.log('Refresh triggered');
                                        handleRefresh();
                                    }}
                                    tintColor={Colors[colorScheme].primary}
                                />
                            }
                        >
                            <View style={styles.gridContainer}>
                                <FijosCorridosColumn />
                                <ParletColumn fijosCorridosList={fijosCorridos} />
                                <CentenasColumn />
                            </View>
                        </ScrollView>
                        <View style={styles.footer}>
                            <View style={styles.totalsContainer}>
                                <SumRowComponent label="Fijos/Corr." total={fijosCorridosTotal} />
                                <SumRowComponent label="Parlets" total={parletsTotal} />
                                <SumRowComponent label="Centenas" total={centenasTotal} />
                            </View>
                            <View style={styles.grandTotalContainer}>
                                <SumRowComponent label="Total Lista" total={grandTotal} />
                            </View>
                        </View>
                    </View>
                );
            })
            .exhaustive();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
            <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
                <Text category='h6' style={styles.title}>{title} - {drawId}</Text>
            </Layout>
            <ColumnHeaders />
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
