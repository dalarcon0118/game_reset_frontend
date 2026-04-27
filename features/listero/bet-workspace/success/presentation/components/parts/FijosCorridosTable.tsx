import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { FormattedBet } from '../../../core/domain/success.types';

interface FijosCorridosTableProps {
    bets: FormattedBet[];
}

export const FijosCorridosTable: React.FC<FijosCorridosTableProps> = ({ bets }) => {
    return (
        <View style={styles.section} collapsable={false}>
            <Text category='s1' style={styles.sectionTitle}>FIJOS / CORRIDOS</Text>
            <View style={styles.tableHeader} collapsable={false}>
                <Text style={[styles.headerText, { flex: 1.5 }]}>Núm</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>Fijo</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>Corr.</Text>
            </View>
            {bets.map((bet, index) => (
                <View key={index} style={styles.tableRow} collapsable={false}>
                    <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <View style={styles.circle} collapsable={false}>
                            <Text category='s1' style={styles.circleText}>{bet.numbers[0]}</Text>
                        </View>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                        {bet.fijoAmount && bet.fijoAmount > 0 ? (
                            <View style={styles.amountCircle} collapsable={false}>
                                <Text style={styles.amountCircleText}>${bet.fijoAmount}</Text>
                            </View>
                        ) : <Text style={styles.emptyDash}>-</Text>}
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                        {bet.corridoAmount && bet.corridoAmount > 0 ? (
                            <View style={styles.amountCircle} collapsable={false}>
                                <Text style={styles.amountCircleText}>${bet.corridoAmount}</Text>
                            </View>
                        ) : <Text style={styles.emptyDash}>-</Text>}
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
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
    circleText: {
        color: '#3366FF',
        fontWeight: 'bold',
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
    emptyDash: {
        color: '#E4E9F2',
    },
});