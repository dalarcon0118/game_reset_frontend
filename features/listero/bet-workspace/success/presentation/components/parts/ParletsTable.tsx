import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { FormattedBet } from '../../core/domain/success.types';

interface ParletsTableProps {
    bets: FormattedBet[];
}

export const ParletsTable: React.FC<ParletsTableProps> = ({ bets }) => {
    return (
        <View style={styles.section} collapsable={false}>
            <View style={styles.divider} />
            <Text category='s1' style={styles.sectionTitle}>PARLETS</Text>
            <View style={styles.tableHeader} collapsable={false}>
                <Text style={[styles.headerText, { flex: 1.5 }]}>Núm</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>Monto</Text>
                <View style={{ flex: 1 }} />
            </View>
            {bets.map((bet, index) => (
                <View key={index} style={styles.tableRow} collapsable={false}>
                    <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <View style={styles.parletCirclesRow} collapsable={false}>
                            {bet.numbers.map((num: string, idx: number) => (
                                <View key={idx} style={styles.circle} collapsable={false}>
                                    <Text style={styles.smallCircleText}>{num}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                        <View style={styles.amountCircle} collapsable={false}>
                            <Text style={styles.amountCircleText}>${bet.amount}</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1 }} />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E9F2',
        marginVertical: 15,
    },
    sectionTitle: {
        color: '#8F9BB3',
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 15,
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    headerText: {
        color: '#8F9BB3',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    tableCell: {
        alignItems: 'flex-start',
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#3366FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallCircleText: {
        fontSize: 12,
        color: '#3366FF',
        fontWeight: 'bold',
    },
    parletCirclesRow: {
        flexDirection: 'row',
        gap: 4,
    },
    amountCircle: {
        backgroundColor: '#F0F4FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D6E4FF',
    },
    amountCircleText: {
        color: '#3366FF',
        fontWeight: 'bold',
        fontSize: 12,
    },
});