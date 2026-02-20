import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { useBetsStore, selectBetsModel, selectDispatch } from '../../bet-workspace/core/store';
import { ListMsgType } from '../../bet-workspace/list/list.types';
import { SumRowComponent } from '../../bet-workspace/shared/components/sum_row_component';
import { LoteriaColumn } from '../components/loteria_column';

interface LoteriaListPlaysProps {
    drawId?: string;
}

export const LoteriaListPlays: React.FC<LoteriaListPlaysProps> = ({ drawId }) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { loteriaTotal } = model.summary;

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
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        minHeight: '101%',
    },
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
