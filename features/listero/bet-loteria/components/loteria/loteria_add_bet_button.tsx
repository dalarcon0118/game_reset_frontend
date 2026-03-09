import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import BetCircle from '@/shared/components/bets/bet_circle';
import Layout from '@/constants/layout';

interface LoteriaAddBetButtonProps {
    isVisible: boolean;
    hasFixedAmount: boolean;
    onPress: () => void;
}

export const LoteriaAddBetButton: React.FC<LoteriaAddBetButtonProps> = memo(({ 
    isVisible, 
    hasFixedAmount, 
    onPress 
}) => {
    if (!isVisible) return null;

    return (
        <View style={[styles.container, hasFixedAmount && styles.centered]}>
            <BetCircle 
                value={"+"} 
                onPress={onPress} 
            />
        </View>
    );
});

LoteriaAddBetButton.displayName = 'LoteriaAddBetButton';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.lg,
    },
    centered: {
        justifyContent: 'center',
    },
});
