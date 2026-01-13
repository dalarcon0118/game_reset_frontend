import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, Text } from '@ui-kitten/components';
import Colors from '@/constants/Colors';

import { ColumnHeaders } from '../shared/components/ColumnHeaders';
import FijosCorridosColumn from '../features/fijos-corridos/components/FijosCorridosColumn';
import { ParletColumn } from '../features/parlet/components/ParletColumn';
import { CentenasColumn } from '../shared/components/CentenasColumn';
import { useBetsStore, selectBetsModel, selectDispatch } from '../core/store';
import { ListMsgType } from '../features/bet-list/list.types';

interface BetsListScreenProps {
    drawId?: string;
    title?: string;
}

export const BetsListScreen: React.FC<BetsListScreenProps> = ({ drawId, title }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const {
        listSession: { fijosCorridos, parlets, centenas, isLoading, error }
    } = model;

    useEffect(() => {
        if (drawId) {
            dispatch({
                type: 'LIST',
                payload: { type: ListMsgType.FETCH_BETS_REQUESTED, drawId }
            });
        }
    }, [drawId, dispatch]);

    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: Colors[colorScheme].background }]}>
                <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: Colors[colorScheme].background }]}>
                <Text status="danger">Error loading bets: {error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
            <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
                <Text category='h6' style={styles.title}>{title}</Text>
            </Layout>
            <ColumnHeaders />
            <ScrollView style={styles.scrollContainer}>
            <View style={styles.gridContainer}>
                <FijosCorridosColumn />
                <ParletColumn fijosCorridosList={fijosCorridos} />
                <CentenasColumn />
            </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { flex: 1 },
    gridContainer: { flexDirection: 'row', flex: 1 },
    title: { textAlign: 'center', margin: 16 },
});
