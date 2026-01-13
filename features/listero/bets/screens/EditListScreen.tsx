import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, Text, Button } from '@ui-kitten/components';
import Colors from '@/constants/Colors';
import LayoutConstants from '@/constants/Layout';

import { ColumnHeaders } from '../shared/components/ColumnHeaders';
import FijosCorridosColumn from '../features/fijos-corridos/components/FijosCorridosColumn';
import { ParletColumn } from '../features/parlet/components/ParletColumn';
import { CentenasColumn } from '../shared/components/CentenasColumn';
import { useBetsStore, selectBetsModel, selectDispatch } from '../core/store';
import { ManagementMsgType } from '../features/management/management.types';

interface EditListScreenProps {
    drawId?: string;
    title?: string;
}
const renderFijosPlayed =({fijosCorridos,parlets, handleSave,isSaving}:any )=>{
    return (fijosCorridos.length > 0 || parlets.length > 0) && (
                <Layout style={[styles.footerBar, { borderTopColor: Colors[colorScheme].border }]} level='1'>
                    <Button
                        status='primary'
                        onPress={handleSave}
                        size="medium"
                        disabled={isSaving}
                        style={styles.footerButton}
                    >
                        {isSaving ? 'Guardando...' : 'Salvar'}
                    </Button>
                </Layout>
            )
}

export const EditListScreen: React.FC<EditListScreenProps> = ({ drawId, title }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const {
        listSession: { fijosCorridos, parlets },
        managementSession: { isSaving, saveSuccess, error }
    } = model;

    useEffect(() => {
        if (drawId) {
            dispatch({
                type: 'MANAGEMENT',
                payload: { type: ManagementMsgType.FETCH_BET_TYPES_REQUESTED, drawId }
            });
        }
    }, [drawId, dispatch]);

    useEffect(() => {
        if (saveSuccess) {
            Alert.alert(
                'Apuestas Guardadas',
                'Las apuestas han sido guardadas exitosamente.',
                [{
                    text: 'OK',
                    onPress: () => dispatch({ type: 'MANAGEMENT', payload: { type: ManagementMsgType.RESET_BETS } })
                }]
            );
        }
    }, [saveSuccess, dispatch]);

    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
        }
    }, [error]);

    const handleSave = () => {
        if (drawId) {
            dispatch({
                type: 'MANAGEMENT',
                payload: { type: ManagementMsgType.SAVE_BETS_REQUESTED, drawId }
            });
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
            <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
                <Text category='h6' style={styles.headerText}>{title}</Text>
            </Layout>
            <ColumnHeaders />
            <ScrollView style={[styles.scrollContainer, (fijosCorridos.length > 0 || parlets.length > 0) && styles.scrollWithFooter]}>
                <View style={styles.betContainer}>
                    <View style={styles.gridContainer}>
                        <FijosCorridosColumn />
                        <ParletColumn fijosCorridosList={fijosCorridos} />
                        <CentenasColumn />
                    </View>
                </View>
            </ScrollView>
            {renderFijosPlayed({fijosCorridos,parlets,handleSave,isSaving})}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 0,
        paddingVertical: LayoutConstants.spacing.xs,
        paddingHorizontal: LayoutConstants.spacing.xs,
        borderBottomWidth: 1,
    },
    headerText: { textAlign: 'center' },
    scrollContainer: { flex: 1, paddingBottom: LayoutConstants.spacing.xl * 2 },
    scrollWithFooter: { paddingBottom: LayoutConstants.spacing.xl * 4 },
    betContainer: { flexDirection: "column" },
    gridContainer: { flexDirection: 'row', flex: 1 },
    footerBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        paddingHorizontal: LayoutConstants.spacing.md,
        paddingVertical: LayoutConstants.spacing.sm,
    },
    footerButton: { width: '100%' },
});
