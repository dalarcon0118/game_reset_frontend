import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/styled_text';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface LoteriaJackpotBannerProps {
    jackpotAmount?: number;
    currency?: string;
}

export const LoteriaJackpotBanner: React.FC<LoteriaJackpotBannerProps> = ({ 
    jackpotAmount, 
    currency = 'DOP' 
}) => {
    if (!jackpotAmount) return null;

    return (
        <View style={styles.jackpotBanner}>
            <StyledText style={styles.jackpotLabel}>PREMIO MAYOR:</StyledText>
            <StyledText style={styles.jackpotValue}>
                ${jackpotAmount.toLocaleString()} {currency}
            </StyledText>
        </View>
    );
};

const styles = StyleSheet.create({
    jackpotBanner: {
        backgroundColor: Colors.light.tint + '15',
        padding: Layout.spacing.sm,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.tint + '30',
    },
    jackpotLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginRight: 8,
    },
    jackpotValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
});
