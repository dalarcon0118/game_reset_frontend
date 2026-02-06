import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, Text } from '@ui-kitten/components';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { match } from 'ts-pattern';

import { getGameComponent } from '@/features/listero/games/registry';
import { useBetsStore, selectBetsModel, selectDispatch } from '../core/store';
import { CoreMsgType } from '../core/msg';

interface EditListScreenProps {
    drawId?: string;
    title?: string;
}

export const EditListScreen: React.FC<EditListScreenProps> = ({ drawId, title }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    useEffect(() => {
        if (drawId) {
            dispatch({
                type: 'CORE',
                payload: {
                    type: CoreMsgType.SCREEN_FOCUSED,
                    drawId,
                    isEditing: true
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
                const GameComponent = getGameComponent(code);

                if (GameComponent) {
                    return <GameComponent drawId={drawId} title={title} />;
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
                <Text category='h6' style={styles.headerText}>{title}</Text>
            </Layout>
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: LayoutConstants.spacing.lg,
        paddingVertical: LayoutConstants.spacing.xs,
        paddingHorizontal: LayoutConstants.spacing.xs,
        borderBottomWidth: 1,
    },
    headerText: { textAlign: 'center' },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
