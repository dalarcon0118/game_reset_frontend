import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import AmountCircle from '@/shared/components/bets/amount_circle';
import BetCircle from '@/shared/components/bets/bet_circle';
import { LoteriaBet } from '@/types';
import { getLoteriaGroups } from '../../utils/loteria_utils';

interface LoteriaBetRowProps {
    item: LoteriaBet;
    isEditing: boolean;
    hasFixedAmount: boolean;
    onEditBet: (id: string) => void;
    onOpenAmountKeyboard: (id: string) => void;
}

export const LoteriaBetRow: React.FC<LoteriaBetRowProps> = memo(({
    item,
    isEditing,
    hasFixedAmount,
    onEditBet,
    onOpenAmountKeyboard,
}) => {
    const groups = getLoteriaGroups(item.bet);

    return (
        <View style={[styles.betRow, hasFixedAmount && styles.betRowCentered]}>
            <View style={styles.circlesContainer}>
                {groups.map((group, index) => (
                    <BetCircle
                        key={`${item.bet}-${index}`}
                        value={group}
                        onPress={() => isEditing && onEditBet(item.id)}
                    />
                ))}
            </View>
            
            {!hasFixedAmount && (
                <AmountCircle
                    amount={item.amount || 0}
                    onPress={() => isEditing && onOpenAmountKeyboard(item.id)}
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    betRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.lg,
    },
    betRowCentered: {
        justifyContent: 'center',
    },
    circlesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
