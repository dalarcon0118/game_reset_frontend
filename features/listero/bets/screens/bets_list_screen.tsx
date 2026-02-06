import React, { useCallback, useEffect } from 'react';
import { match } from 'ts-pattern';
import { StyleSheet, View, ScrollView, ActivityIndicator, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Layout, Button } from '@ui-kitten/components';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';

import { useBetsStore, selectBetsModel, selectDispatch } from '../core/store';
import { getGameListComponent } from '@/features/listero/games/registry';
import { ListMsgType } from '../features/bet-list/list.types';
import { CoreMsgType } from '../core/msg';

interface BetsListScreenProps {
    drawId?: string;
    title?: string;
}

export const BetsListScreen = ({ drawId, title }: BetsListScreenProps) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;

    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    useEffect(() => {
        if (drawId) {
            dispatch({
                type: 'CORE',
                payload: {
                    type: CoreMsgType.SCREEN_FOCUSED,
                    drawId,
                    isEditing: false
                }
            });
        }
    }, [drawId, dispatch]);

    const { isRefreshing } = model.listSession;


    // La carga de apuestas ahora se maneja mediante la suscripción TEA en update.ts
    // que observa los cambios en la ruta de navegación y dispara SCREEN_FOCUSED.

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

    const renderContent = () => {
        return match(model.drawTypeCode)
            .with({ type: 'Loading' }, () => (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                    <Text category='s1' style={{ marginTop: 10 }}>Cargando configuración...</Text>
                </View>
            ))
            .with({ type: 'Success' }, ({ data: code }) => {
                // Si el estado es Success y no hay apuestas, mostramos el mensaje de lista vacía
                if (model.listSession.remoteData.type === 'Success') {
                    const { fijosCorridos, parlets, centenas, loteria = [] } = model.listSession.remoteData.data;
                    const hasNoBets = fijosCorridos.length === 0 && parlets.length === 0 && centenas.length === 0 && loteria.length === 0;

                    if (hasNoBets) {
                        return (
                            <View style={styles.centerContainer}>
                                <Text category='h6' style={styles.emptyText}>Todavía no hay apuestas para mostrar</Text>
                                <Button
                                    style={styles.actionButton}
                                    onPress={() => dispatch({ type: 'CORE', payload: { type: CoreMsgType.NAVIGATE_TO_CREATE } })}
                                >
                                    Anotar
                                </Button>
                            </View>
                        );
                    }
                }

                const GameListComponent = getGameListComponent(code);

                if (GameListComponent) {
                    return <GameListComponent drawId={drawId} title={title} />;
                }

                return (
                    <View style={styles.centerContainer}>
                        <Text category='h6'>Tipo de sorteo no soportado</Text>
                        <Text appearance='hint'>{code || 'Sin código'}</Text>
                    </View>
                );
            })
            .with({ type: 'Failure' }, ({ error }) => (
                <View style={styles.centerContainer}>
                    <Text category='h6' status='danger'>Error al cargar el sorteo</Text>
                    <Text appearance='hint'>{error}</Text>
                </View>
            ))
            .otherwise(() => (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                </View>
            ));
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
            <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
                <Text category='h6' style={styles.title}>{title}</Text>
            </Layout>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[Colors[colorScheme].primary]}
                        tintColor={Colors[colorScheme].primary}
                    />
                }
            >
                {renderContent()}
            </ScrollView>
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
    emptyText: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#8F9BB3',
    },
    actionButton: {
        minWidth: 150,
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
