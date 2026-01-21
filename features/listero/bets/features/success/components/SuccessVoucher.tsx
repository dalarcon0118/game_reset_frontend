import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@/shared/components';
import { FormattedBet, VoucherMetadata } from '../success.types';

interface SuccessVoucherProps {
    drawId: string | null;
    receiptCode: string;
    bets: FormattedBet[];
    totalAmount: number;
    metadata: VoucherMetadata;
}

export const SuccessVoucher: React.FC<SuccessVoucherProps> = ({ drawId, receiptCode, bets, totalAmount, metadata }) => {
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

            {/* Nueva sección de Información del Sorteo */}
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Text category='c1' style={styles.infoLabel}>Fecha Emisión:</Text>
                    <Text category='c1' style={styles.infoValue}>{metadata.issueDate}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text category='c1' style={styles.infoLabel}>Fecha Premiación:</Text>
                    <Text category='c1' style={styles.infoValue}>{metadata.awardDate}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text category='c1' style={styles.infoLabel}>Premio Total:</Text>
                    <Text category='c1' status='info' style={styles.jackpotValue}>{metadata.totalPrize}</Text>
                </View>
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
                        <Text category='s2' style={styles.betType}>{bet.type}</Text>
                    </View>
                    <Text category='s1' style={styles.betAmount}>
                        ${bet.amount}
                    </Text>
                </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
                <Text category='h6'>Total</Text>
                <Text category='h6' status='primary'>${totalAmount}</Text>
            </View>

            <View style={styles.divider} />

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
                <Text category='c1' appearance='hint' style={styles.disclaimerText}>
                    {metadata.disclaimer}
                </Text>
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
    infoSection: {
        backgroundColor: '#F7F9FC',
        padding: 10,
        borderRadius: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    infoLabel: {
        color: '#8F9BB3',
        fontWeight: '500',
    },
    infoValue: {
        color: '#222B45',
        fontWeight: '600',
    },
    jackpotValue: {
        fontWeight: 'bold',
        fontSize: 13,
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
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#2E5BFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    circleText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2E5BFF',
    },
    hyphen: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E5BFF',
        marginHorizontal: 2,
    },
    betType: {
        marginTop: 4,
        color: '#222B45',
        fontWeight: '600',
    },
    betAmount: {
        fontWeight: '700',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    disclaimerContainer: {
        marginTop: 5,
        padding: 5,
    },
    disclaimerText: {
        textAlign: 'center',
        fontSize: 10,
        fontStyle: 'italic',
        lineHeight: 14,
    },
});
