import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Layout } from '@ui-kitten/components';
import { FijosCorridosBet, ParletBet, CentenaBet } from '@/types';
import LayoutConstants from '@/constants/Layout';

interface TotalSumComponentProps {
    fijosCorridos: FijosCorridosBet[];
    parlets: ParletBet[];
    centenas: CentenaBet[];
}

export const TotalSumComponent: React.FC<TotalSumComponentProps> = ({
    fijosCorridos,
    parlets,
    centenas
}) => {
    // Calculate fijos and corridos total
    const fijosCorridosTotal = fijosCorridos.reduce((total, bet) => {
        const fijoAmount = bet.fijoAmount || 0;
        const corridoAmount = bet.corridoAmount || 0;
        return total + fijoAmount + corridoAmount;
    }, 0);

    // Calculate parlets total: number of bets * (number of bets - 1) * amount
    const parletsTotal = parlets.reduce((total, parlet) => {
        if (parlet.bets && parlet.bets.length > 0 && parlet.amount) {
            const numBets = parlet.bets.length;
            const parletTotal = numBets * (numBets - 1) * parlet.amount;
            return total + parletTotal;
        }
        return total;
    }, 0);

    // Calculate centenas total
    const centenasTotal = centenas.reduce((total, centena) => {
        return total + (centena.amount || 0);
    }, 0);

    const grandTotal = fijosCorridosTotal + parletsTotal + centenasTotal;

    return (
        <Layout style={styles.container} level='2'>
            <View style={styles.totalRow}>
                <Text category='s1' style={styles.totalLabel}>Suma:</Text>
                <Text category='s1' style={styles.totalAmount}>
                    ${grandTotal.toFixed(2)}
                </Text>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: LayoutConstants.spacing.md,
        paddingHorizontal: LayoutConstants.spacing.md,
        paddingVertical: LayoutConstants.spacing.sm,
        borderRadius: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    totalAmount: {
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default TotalSumComponent;