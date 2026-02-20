import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SumRowComponent } from '@/features/bet-workspace/shared/components/sum_row_component';
import LayoutConstants from '@/constants/layout';

interface BolitaListFooterProps {
    fijosCorridosTotal: number;
    parletsTotal: number;
    centenasTotal: number;
    grandTotal: number;
}

export const BolitaListFooter: React.FC<BolitaListFooterProps> = ({
    fijosCorridosTotal,
    parletsTotal,
    centenasTotal,
    grandTotal,
}) => {
    return (
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
    );
};

const styles = StyleSheet.create({
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
    columnWrapperFijos: { flex: 3, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperParlet: { flex: 2, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperCentena: { flex: 2 },
    grandTotalContainer: {
        borderTopWidth: 2,
        borderTopColor: '#E8E8E8',
        paddingTop: LayoutConstants.spacing.xs,
    },
});
