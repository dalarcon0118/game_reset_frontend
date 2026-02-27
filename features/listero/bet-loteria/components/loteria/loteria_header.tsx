import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/styled_text';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface LoteriaHeaderProps {
    hasFixedAmount: boolean;
    fixedAmount: number | null;
}

export const LoteriaHeader: React.FC<LoteriaHeaderProps> = ({ hasFixedAmount, fixedAmount }) => {
    return (
        <View style={styles.header}>
            <StyledText style={styles.headerText}>Número</StyledText>
            {!hasFixedAmount && (
                <StyledText style={styles.headerText}>Monto</StyledText>
            )}
            {hasFixedAmount && (
                <StyledText style={styles.priceLabel}>Precio: ${fixedAmount}</StyledText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: Layout.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        marginBottom: Layout.spacing.sm,
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.light.text,
    },
    priceLabel: {
        fontSize: 14,
        color: Colors.light.tint,
        fontWeight: '600',
    },
});
