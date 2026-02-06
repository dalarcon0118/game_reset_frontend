import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, useColorScheme, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { useBetsStore, selectBetsModel, selectDispatch } from '@/features/listero/bets/core/store';
import { ColumnHeaders } from '@/features/listero/bets/shared/components/column_headers';
import FijosCorridosColumn from '@/features/listero/bets/features/fijos-corridos/components/fijos_corridos_column';
import { ParletColumn } from '@/features/listero/bets/features/parlet/components/parlet_column';
import { CentenaColumn } from '@/features/listero/bets/features/centena/components/centena_column';
import { SumRowComponent } from '@/features/listero/bets/shared/components/sum_row_component';
import { ListMsgType } from '@/features/listero/bets/features/bet-list/list.types';
import { CoreMsgType } from '@/features/listero/bets/core/msg';

interface BolitaListPlaysProps {
    drawId?: string;
}

export const BolitaListPlays: React.FC<BolitaListPlaysProps> = ({ drawId }) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
    const navigation = useNavigation<any>();
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal, isSaving } = model.summary;
    const { isRefreshing } = model.listSession;

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

    const remoteData = model.listSession.remoteData as any;

    if (remoteData.type === 'NotAsked') return null;
    if (remoteData.type === 'Loading') {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                <Text style={styles.loadingText}>Cargando lista...</Text>
            </View>
        );
    }
    if (remoteData.type === 'Failure') {
        return (
            <View style={styles.centerContainer}>
                <Text category='label' style={{ color: 'red' }}>Error: {remoteData.error}</Text>
            </View>
        );
    }

    const { fijosCorridos, centenas, parlets } = model.listSession.remoteData.data;

    const handleViewReceipt = () => {
        // Navigate to success screen with current draw context
        // Pass the drawId as a parameter to ensure the success screen has the right context
        if (drawId) {
            navigation.navigate('/lister/bets/success', { drawId });
        } else {
            navigation.navigate('/lister/bets/success');
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ColumnHeaders />
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
                        onRefresh={handleRefresh}
                        tintColor={Colors[colorScheme].primary}
                    />
                }
            >
                <View style={styles.gridContainer}>
                    <View style={styles.columnWrapperFijos}>
                        <FijosCorridosColumn editable={false} />
                    </View>
                    <View style={styles.columnWrapperParlet}>
                        <ParletColumn fijosCorridosList={fijosCorridos} editable={false} />
                    </View>
                    <View style={styles.columnWrapperCentena}>
                        <CentenaColumn editable={false} />
                    </View>
                </View>

                {/* Separador con botón "Ver comprobante" */}
                {(fijosCorridos.length > 0 || centenas.length > 0 || parlets.length > 0) && (
                    <View style={styles.receiptSeparator}>
                        <TouchableOpacity
                            style={[styles.receiptButton, { backgroundColor: Colors[colorScheme].primary }]}
                            onPress={handleViewReceipt}
                        >
                            <Text style={styles.receiptButtonText}>Ver comprobante</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            <View style={styles.footer}>
                <View style={styles.totalsRowContainer}>
                    <View style={styles.columnWrapperFijos}>
                        <SumRowComponent label="F/C" total={fijosCorridosTotal} />
                    </View>
                    <View style={styles.columnWrapperParlet}>
                        <SumRowComponent label="P" total={parletsTotal} />
                    </View>
                    <View style={styles.columnWrapperCentena}>
                        <SumRowComponent label="C" total={centenasTotal} />
                    </View>
                </View>
                <View style={styles.grandTotalContainer}>
                    <SumRowComponent label="Total Lista" total={grandTotal} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    columnWrapperFijos: { flex: 3, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperParlet: { flex: 2, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperCentena: { flex: 2 },
    receiptSeparator: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 8,
        marginVertical: 5,
        borderRadius: 8,
    },
    receiptButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    receiptButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        padding: LayoutConstants.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        backgroundColor: '#FFFFFF',
    },
    totalsRowContainer: {
        flexDirection: 'row',
        marginBottom: LayoutConstants.spacing.xs,
    },
    grandTotalContainer: {
        borderTopWidth: 2,
        borderTopColor: '#E8E8E8',
        paddingTop: LayoutConstants.spacing.xs,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
    },
});

export default BolitaListPlays;
