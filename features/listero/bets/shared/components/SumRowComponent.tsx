import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Layout } from '@ui-kitten/components';
import { FijosCorridosBet, ParletBet, CentenaBet } from '@/types';
import LayoutConstants from '@/constants/Layout';

interface SumRowComponentProps {
    label: string;
    total: number;
}

export const SumRowComponent: React.FC<SumRowComponentProps> = ({
    label,
    total
}) => {
    return (
        <Layout style={styles.container} level='3'>
            <View style={styles.totalRow}>
                <Text category='s2' style={styles.totalLabel}>{label}:</Text>
                <Text category='s2' style={styles.totalAmount}>
                    ${total.toFixed(2)}
                </Text>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: LayoutConstants.spacing.xs,
        paddingVertical: LayoutConstants.spacing.sm,
        borderRadius: 0,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    totalAmount: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SumRowComponent;