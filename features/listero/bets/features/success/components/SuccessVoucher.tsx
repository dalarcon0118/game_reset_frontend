import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@/shared/components';
import { FormattedBet } from '../success.types';

interface SuccessVoucherProps {
    drawId: string | null;
    receiptCode: string;
    bets: FormattedBet[];
    totalAmount: number;
}

export const SuccessVoucher: React.FC<SuccessVoucherProps> = ({ drawId, receiptCode, bets, totalAmount }) => {
    return (
        <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <View>
                    <Text category='s1'>Detalle de Apuestas</Text>
                    <Text category='s1' style={styles.receiptLabel}>
                        Recibo: <Text category='s1' style={styles.receiptCode}>{receiptCode}</Text>
                    </Text>
                </View>
                <Text appearance='hint' category='c1'>{`Sorteo ID: ${drawId || 'N/A'}`}</Text>
            </View>
            
            <View style={styles.divider} />

            {bets.map((bet, index) => (
                <View key={bet.id || index} style={styles.betRow}>
                    <View style={styles.betInfo}>
                        <View style={styles.numbersContainer}>
                            {bet.numbers.map((num: string, idx: number) => (
                                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={styles.circle}>
                                        <Text category='s1' style={styles.circleText}>{num}</Text>
                                    </View>
                                    {idx < bet.numbers.length - 1 && (
                                        <Text style={styles.hyphen}>-</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                        <Text category='c1' appearance='hint' style={styles.betType}>{bet.type}</Text>
                    </View>
                    <Text category='s1'>
                        ${bet.amount}
                    </Text>
                </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
                <Text category='h6'>Total</Text>
                <Text category='h6' status='primary'>${totalAmount}</Text>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    summaryCard: {
        width: '100%',
        marginBottom: 0,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    receiptLabel: {
        color: '#8F9BB3',
        marginTop: 2,
    },
    receiptCode: {
        fontWeight: 'bold',
        color: '#222B45',
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E9F2',
        marginVertical: 15,
    },
    betRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 5,
    },
    betInfo: {
        flex: 1,
    },
    numbersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    circle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#3366FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    circleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3366FF',
    },
    hyphen: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3366FF',
        marginHorizontal: 2,
    },
    betType: {
        marginTop: 2,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
