import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { FormattedBet } from '../../../core/domain/success.types';
import { LoteriaNumbers } from '../parts/LoteriaNumbers';

const isLoteriaBet = (betType: string): boolean => {
    const normalized = betType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('loteria') || normalized.includes('cuaterna');
};

interface LoteriaBetRowProps {
    bet: FormattedBet;
}

const LoteriaBetRow: React.FC<LoteriaBetRowProps> = ({ bet }) => {
    return (
        <View style={styles.row} collapsable={false}>
            <View style={styles.info}>
                <LoteriaNumbers numbers={bet.numbers} />
                <Text category='s2' style={styles.betType}>{bet.type}</Text>
            </View>
            <Text category='s1' style={styles.betAmount}>
                ${bet.amount}
            </Text>
        </View>
    );
};

interface VoucherLoteriaBodyProps {
    bets: FormattedBet[];
}

export const VoucherLoteriaBody: React.FC<VoucherLoteriaBodyProps> = ({ bets }) => {
    const loteriaBets = bets.filter(b => isLoteriaBet(b.type));

    return (
        <>
            {loteriaBets.map((bet, index) => (
                <LoteriaBetRow key={bet.id || index} bet={bet} />
            ))}
        </>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 5,
    },
    info: {
        flex: 1,
    },
    betType: {
        color: '#8F9BB3',
    },
    betAmount: {
        color: '#222B45',
    },
});