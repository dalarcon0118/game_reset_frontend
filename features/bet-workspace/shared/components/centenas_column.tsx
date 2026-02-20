import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/styled_text';
import Layout from '@/constants/layout';
import AmountCircle from './amount_circle';
import { useBetsStore, selectBetsModel } from '../../core/store';

interface CentenasColumnProps {
    editable?: boolean;
}

export const CentenasColumn: React.FC<CentenasColumnProps> = ({ editable = false }) => {
    const model = useBetsStore(selectBetsModel);
    const { listSession } = model;
    const bets = listSession.remoteData.type === 'Success'
        ? listSession.remoteData.data.centenas
        : [];

    return (
        <View style={[styles.column, styles.colCentenas]}>
            <View style={styles.columnContent}>
                {bets.map((item) => (
                    <View key={item.id} style={styles.centenaRow}>
                        <StyledText style={styles.centenaBetText}>{item.bet}</StyledText>
                        <AmountCircle 
                            amount={item.amount} 
                            onPress={editable ? () => { /* Add logic if needed */ } : undefined}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    column: {
        borderRightWidth: 1,
        borderRightColor: '#E8E8E8',
        flex: 1,
        paddingTop: 10
    },
    colCentenas: {
        flex: 2,
        borderRightWidth: 0,
        paddingHorizontal: Layout.spacing.xs,
    },
    columnContent: {
        paddingVertical: Layout.spacing.xs,
    },
    centenaRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.xs,
    },
    centenaBetText: {
        marginRight: Layout.spacing.sm,
    },
});
