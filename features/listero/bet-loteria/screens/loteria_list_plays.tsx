import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, useColorScheme, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { match } from 'ts-pattern';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { SumRowComponent } from '@/shared/components/bets/sum_row_component';
import { LoteriaColumn } from '../components/loteria/loteria_column';
import { LoteriaStoreProvider } from '../core/store';
import { LoteriaListProvider, useLoteriaListContext } from '../presentation/context/LoteriaListContext';
import { EmptyBetsView } from '@/shared/components/bets/empty';

interface LoteriaListContentProps {
    drawId: string;
}

const LoteriaListContent: React.FC<LoteriaListContentProps> = ({ drawId }) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
    const {
        loteriaTotal,
        isRefreshing,
        handleRefresh,
        remoteData,
        groupedBets,
        handleViewReceipt
    } = useLoteriaListContext();

    return match(remoteData)
        .with({ type: 'Loading' }, () => (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
            </View>
        ))
        .with({ type: 'Failure' }, ({ error }) => (
            <View style={[styles.container, styles.loadingContainer]}>
                <EmptyBetsView 
                    onAnotar={() => router.push({ pathname: '/lister/bets/loteria/anotate', params: { id: drawId } })} 
                    goToHome={() => router.push({ pathname: '/' })}
                />
            </View>
        ))
        .with({ type: 'Success' }, () => {
            const isEmpty = groupedBets.length === 0;
            if (isEmpty) {
                return (
                    <EmptyBetsView 
                        onAnotar={() => router.push({ pathname: '/lister/bets/loteria/anotate', params: { id: drawId } })} 
                        goToHome={() => router.push({ pathname: '/' })}
                    />
                );
            }

            return (
                <View style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.contentContainer}
                        alwaysBounceVertical={true}
                        scrollEventThrottle={16}
                        refreshControl={
                            <RefreshControl
                                refreshing={!!isRefreshing}
                                onRefresh={handleRefresh}
                                tintColor={Colors[colorScheme].primary}
                            />
                        }
                    >
                        <View style={styles.content}>
                            <LoteriaColumn 
                                isEditing={false} 
                                onViewReceipt={handleViewReceipt}
                            />
                        </View>
                    </ScrollView>
                    <View style={styles.footer}>
                        <View style={styles.grandTotalContainer}>
                            <SumRowComponent label="Total Loteria" total={loteriaTotal} />
                        </View>
                    </View>
                </View>
            );
        })
        .otherwise(() => null);
};

interface LoteriaListPlaysProps {
    drawId?: string;
    isEditing?: boolean;
}

export const LoteriaListPlays: React.FC<LoteriaListPlaysProps> = ({ drawId, isEditing = false }) => {
    if (!drawId) return null;

    return (
        <LoteriaStoreProvider initialParams={{ drawId }}>
            <LoteriaListProvider drawId={drawId}>
                <LoteriaListContent drawId={drawId} />
            </LoteriaListProvider>
        </LoteriaStoreProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        minHeight: '101%',
        paddingBottom: LayoutConstants.spacing.md,
    },
    content: {
        flex: 1,
        paddingTop: LayoutConstants.spacing.xs,
    },
    footer: {
        padding: LayoutConstants.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        backgroundColor: '#FFFFFF',
    },
    grandTotalContainer: {
        borderTopWidth: 2,
        borderTopColor: '#E8E8E8',
        paddingTop: LayoutConstants.spacing.xs,
    },
});

export default LoteriaListPlays;
