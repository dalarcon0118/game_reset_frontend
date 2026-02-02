import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { Text } from '@ui-kitten/components';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { useBetsStore, selectBetsModel, selectDispatch } from '@/features/listero/bets/core/store';
import { ListMsgType } from '@/features/listero/bets/features/bet-list/list.types';
import { SumRowComponent } from '@/features/listero/bets/shared/components/sum_row_component';
import { LoteriaColumn } from '../components/loteria_column';

interface LoteriaListPlaysProps {
    drawId?: string;
}

export const LoteriaListPlays: React.FC<LoteriaListPlaysProps> = ({ drawId }) => {
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

    const loteriaTotal = useMemo(() => {
        const { loteria } = model.listSession.remoteData.type === 'Success'
            ? model.listSession.remoteData.data
            : { loteria: [] };
        return loteria.reduce((total, bet) => total + (bet.amount || 0), 0);
    }, [model.listSession.remoteData]);

    if (model.listSession.remoteData.type !== 'Success') {
        return null;
    }

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
                        onRefresh={handleRefresh}
                        tintColor={Colors[colorScheme].primary}
                    />
                }
            >
                <View style={styles.content}>
                    <LoteriaColumn isEditing={false} />
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <View style={styles.grandTotalContainer}>
                    <SumRowComponent label="Total Loteria" total={loteriaTotal} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingTop: 16,
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
