import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { Text } from '@ui-kitten/components';
import Colors from '@/constants/Colors';
import LayoutConstants from '@/constants/Layout';
import { useBetsStore, selectBetsModel, selectDispatch } from '@/features/listero/bets/core/store';
import { ColumnHeaders } from '@/features/listero/bets/shared/components/ColumnHeaders';
import FijosCorridosColumn from '@/features/listero/bets/features/fijos-corridos/components/FijosCorridosColumn';
import { ParletColumn } from '@/features/listero/bets/features/parlet/components/ParletColumn';
import { CentenaColumn } from '@/features/listero/bets/features/centena/components/CentenaColumn';
import { SumRowComponent } from '@/features/listero/bets/shared/components/SumRowComponent';
import { ListMsgType } from '@/features/listero/bets/features/bet-list/list.types';

interface BolitaListPlaysProps {
    drawId?: string;
}

export const BolitaListPlays: React.FC<BolitaListPlaysProps> = ({ drawId }) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

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

    if (model.listSession.remoteData.type !== 'Success') {
        return null;
    }

    const { fijosCorridos, parlets, centenas } = model.listSession.remoteData.data;

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
    columnWrapperFijos: { flex: 3, borderRightWidth: 1, borderRightColor: '#E8E8E8', },
    columnWrapperParlet: { flex: 2, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperCentena: { flex: 2 },
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
});

export default BolitaListPlays;
