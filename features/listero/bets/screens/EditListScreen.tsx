import React from 'react';
import { View, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, Text } from '@ui-kitten/components';
import { match } from 'ts-pattern';
import Colors from '@/constants/Colors';
import LayoutConstants from '@/constants/Layout';

import { getGameComponent } from '@/features/listero/games/registry';
import { useBetsStore, selectBetsModel, selectInit } from '../core/store';

interface EditListScreenProps {
    drawId?: string;
    title?: string;
}


export const EditListScreen: React.FC<EditListScreenProps> = ({ drawId, title }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const model = useBetsStore(selectBetsModel);
    const init = useBetsStore(selectInit);

    console.log('EditListScreen render:', {
        drawId,
        modelDrawId: model.drawId,
        drawTypeCode: model.drawTypeCode.type,
        listRemoteData: model.listSession.remoteData.type
    });

    React.useEffect(() => {
        // Siempre inicializar con fetchExistingBets: false al entrar en la pantalla de anotación.
        // Esto garantiza que la interfaz de anotación siempre empiece limpia,
        // cumpliendo con el requerimiento de que cada sesión de anotación sea independiente.
        if (drawId) {
            console.log('EditListScreen: Forcing clean initialization for drawId:', drawId);
            init({ drawId, fetchExistingBets: false });
        }
    }, [drawId, init]); // Eliminamos la dependencia de model.drawId y remoteData.type para forzar el reinicio

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
            <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
                <Text category='h6' style={styles.headerText}>{title}</Text>
            </Layout>
            {match(model.drawTypeCode)
                .with({ type: 'Loading' }, () => (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                    </View>
                ))
                .with({ type: 'Failure' }, ({ error }) => (
                    <View style={styles.centerContainer}>
                        <Text status="danger">{typeof error === 'string' ? error : 'Error al cargar el sorteo'}</Text>
                    </View>
                ))
                .with({ type: 'Success' }, ({ data: drawTypeCode }) => {
                    const GameComponent = getGameComponent(drawTypeCode);
                    
                    if (GameComponent) {
                        return <GameComponent drawId={drawId} title={title} />;
                    }

                    return (
                        <View style={styles.centerContainer}>
                            <Text category='h6'>Tipo de sorteo no soportado</Text>
                            <Text appearance='hint'>{drawTypeCode}</Text> 
                        </View>
                    );
                })
                .otherwise(() => (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="small" color={Colors[colorScheme].primary} />
                    </View>
                ))}
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
