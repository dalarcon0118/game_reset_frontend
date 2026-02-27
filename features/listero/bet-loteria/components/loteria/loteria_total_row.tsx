import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/styled_text';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface LoteriaTotalRowProps {
    totalAmount: number;
}

export const LoteriaTotalRow: React.FC<LoteriaTotalRowProps> = ({ totalAmount }) => {
    if (totalAmount <= 0) return null;

    return (
        <View style={styles.totalRow}>
            <StyledText style={styles.totalLabel}>Total:</StyledText>
            <StyledText style={styles.totalValue}>${totalAmount}</StyledText>
        </View>
    );
};

const styles = StyleSheet.create({
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: Layout.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        marginTop: Layout.spacing.sm,
        paddingRight: Layout.spacing.lg,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginRight: Layout.spacing.sm,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
});
