import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { SumRowComponent } from '@/shared/components/bets/sum_row_component';
import { LoteriaColumn } from '../components/loteria_column';
import { useLoteria } from '../use_loteria';

interface LoteriaListPlaysProps {
    drawId?: string;
    isEditing?: boolean;
}

export const LoteriaListPlays: React.FC<LoteriaListPlaysProps> = ({ drawId, isEditing: isEditingProp = false }) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;
    
    const {
        loteriaTotal,
        isRefreshing,
        refreshBets,
        listStatus,
        isEditing
    } = useLoteria(drawId, isEditingProp);

    const handleRefresh = useCallback(() => {
        if (drawId) {
            refreshBets(drawId);
        }
    }, [drawId, refreshBets]);

    // Show list if we have success from server OR if we are in editing mode (local plays)
    const shouldShowList = listStatus === 'Success' || isEditing;

    if (!shouldShowList) {
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
                    {/* 
                      * La lista de jugadas siempre se muestra en modo lectura (isEditing={false})
                      * Esto es crítico para que cuando se use debajo del anotador no duplique teclados
                      * ni permita edición accidental desde la lista de resumen.
                    */}
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
