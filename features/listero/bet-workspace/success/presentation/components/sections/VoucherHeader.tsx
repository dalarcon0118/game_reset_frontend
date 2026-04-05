import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { VoucherMetadata } from '../../core/domain/success.types';

interface VoucherHeaderProps {
    receiptCode: string;
    drawId: string | null;
    metadata: VoucherMetadata;
    isAnyLoteria: boolean;
}

export const VoucherHeader: React.FC<VoucherHeaderProps> = ({
    receiptCode,
    drawId,
    metadata,
    isAnyLoteria
}) => {
    return (
        <>
            <View style={styles.header} collapsable={false}>
                <View>
                    <Text category='s1' style={styles.title}>Detalle de Apuestas</Text>
                    <Text category='s1' style={styles.receiptLabel}>
                        Recibo: <Text category='s1' style={styles.receiptCode}>{receiptCode}</Text>
                    </Text>
                </View>
                <Text category='c1' style={styles.drawIdLabel}>{`Sorteo ID: ${drawId || 'N/A'}`}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection} collapsable={false}>
                <View style={styles.infoRow}>
                    <Text category='c1' style={styles.infoLabel}>Fecha Emisión:</Text>
                    <Text category='c1' style={styles.infoValue}>{metadata.issueDate}</Text>
                </View>
                {isAnyLoteria && (
                    <View style={styles.infoRow}>
                        <Text category='c1' style={styles.infoLabel}>Hora Emisión:</Text>
                        <Text category='c1' style={styles.infoValue}>
                            {metadata.issueDate.split(' ')[1] || metadata.issueDate}
                        </Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Text category='c1' style={styles.infoLabel}>Fecha Premiación:</Text>
                    <Text category='c1' style={styles.infoValue}>{metadata.awardDate}</Text>
                </View>
                <View style={[styles.infoRow, isAnyLoteria && styles.highlightedPrizeRow]}>
                    <Text category='c1' style={[styles.infoLabel, isAnyLoteria && styles.highlightedPrizeLabel]}>Premio Total:</Text>
                    <Text
                        category={isAnyLoteria ? 'h6' : 'c1'}
                        status={isAnyLoteria ? 'primary' : 'info'}
                        style={isAnyLoteria ? styles.highlightedPrizeValue : styles.jackpotValue}
                    >
                        {metadata.totalPrize}
                    </Text>
                </View>
                {metadata.prizeRules && metadata.prizeRules.length > 0 && (
                    <View style={styles.prizeRulesSection}>
                        <Text category='c1' style={styles.prizeRulesTitle}>Premios Adicionales:</Text>
                        {metadata.prizeRules.map((rule, index) => (
                            <View key={index} style={styles.prizeRuleRow}>
                                <Text category='c2' style={styles.prizeRuleLabel}>{rule.label}:</Text>
                                <Text category='c2' style={styles.prizeRuleDescription}>{rule.description}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.divider} />
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        color: '#222B45',
    },
    receiptLabel: {
        color: '#8F9BB3',
        marginTop: 2,
    },
    receiptCode: {
        fontWeight: 'bold',
        color: '#222B45',
    },
    drawIdLabel: {
        color: '#8F9BB3',
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
    highlightedPrizeRow: {
        backgroundColor: '#FFFFFF',
        marginTop: 8,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
        alignItems: 'center',
    },
    highlightedPrizeLabel: {
        color: '#222B45',
        fontWeight: 'bold',
        fontSize: 12,
    },
    highlightedPrizeValue: {
        fontWeight: '900',
        fontSize: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E9F2',
        marginVertical: 15,
    },
    prizeRulesSection: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E4E9F2',
    },
    prizeRulesTitle: {
        color: '#8F9BB3',
        fontWeight: '600',
        marginBottom: 6,
    },
    prizeRuleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    prizeRuleLabel: {
        color: '#222B45',
        fontWeight: '600',
    },
    prizeRuleDescription: {
        color: '#8F9BB3',
        flex: 1,
        textAlign: 'right',
        marginLeft: 8,
    },
});