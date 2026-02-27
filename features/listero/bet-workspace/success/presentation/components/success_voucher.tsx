import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@/shared/components';
import { FormattedBet, VoucherMetadata } from '../../core/domain/success.types';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';

interface SuccessVoucherProps {
    drawId: string | null;
    receiptCode: string;
    bets: FormattedBet[];
    totalAmount: number;
    metadata: VoucherMetadata;
    isBolita?: boolean;
    groupedBets?: {
        fijosCorridos: any[];
        parlets: any[];
        centenas: any[];
    } | null;
}

export const SuccessVoucher: React.FC<SuccessVoucherProps> = ({ 
    drawId, 
    receiptCode, 
    bets, 
    totalAmount, 
    metadata,
    isBolita,
    groupedBets
}) => {
    const renderBolitaLayout = () => {
        if (!groupedBets) return null;

        return (
            <View style={styles.bolitaContainer} collapsable={false}>
                {/* Fila 1: Fijos y Corridos */}
                {groupedBets.fijosCorridos.length > 0 && (
                    <View style={styles.bolitaSection} collapsable={false}>
                        <Text category='s1' style={styles.sectionTitle}>FIJOS / CORRIDOS</Text>
                        <View style={styles.fijoCorridoTableHeader} collapsable={false}>
                            <Text style={[styles.headerText, { flex: 1.5 }]}>Núm</Text>
                            <Text style={[styles.headerText, { flex: 1 }]}>Fijo</Text>
                            <Text style={[styles.headerText, { flex: 1 }]}>Corr.</Text>
                        </View>
                        {groupedBets.fijosCorridos.map((bet, index) => (
                            <View key={index} style={styles.fijoCorridoTableRow} collapsable={false}>
                                <View style={[styles.tableCell, { flex: 1.5 }]}>
                                    <View style={styles.circle} collapsable={false}>
                                        <Text category='s1' style={styles.circleText}>{bet.numbers[0]}</Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCell, { flex: 1 }]}>
                                    {bet.fijoAmount > 0 ? (
                                        <View style={styles.amountCircle} collapsable={false}>
                                            <Text style={styles.amountCircleText}>${bet.fijoAmount}</Text>
                                        </View>
                                    ) : <Text style={styles.emptyDash}>-</Text>}
                                </View>
                                <View style={[styles.tableCell, { flex: 1 }]}>
                                    {bet.corridoAmount > 0 ? (
                                        <View style={styles.amountCircle} collapsable={false}>
                                            <Text style={styles.amountCircleText}>${bet.corridoAmount}</Text>
                                        </View>
                                    ) : <Text style={styles.emptyDash}>-</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Fila 2: Parlets */}
                {groupedBets.parlets.length > 0 && (
                    <View style={styles.bolitaSection} collapsable={false}>
                        <View style={styles.divider} />
                        <Text category='s1' style={styles.sectionTitle}>PARLETS</Text>
                        <View style={styles.fijoCorridoTableHeader} collapsable={false}>
                            <Text style={[styles.headerText, { flex: 1.5 }]}>Núm</Text>
                            <Text style={[styles.headerText, { flex: 1 }]}>Monto</Text>
                            <View style={{ flex: 1 }} />
                        </View>
                        {groupedBets.parlets.map((bet, index) => (
                            <View key={index} style={styles.fijoCorridoTableRow} collapsable={false}>
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
                )}

                {/* Fila 3: Centenas */}
                {groupedBets.centenas.length > 0 && (
                    <View style={styles.bolitaSection} collapsable={false}>
                        <View style={styles.divider} />
                        <Text category='s1' style={styles.sectionTitle}>CENTENAS</Text>
                        <View style={styles.fijoCorridoTableHeader} collapsable={false}>
                            <Text style={[styles.headerText, { flex: 1.5 }]}>Núm</Text>
                            <Text style={[styles.headerText, { flex: 1 }]}>Monto</Text>
                            <View style={{ flex: 1 }} />
                        </View>
                        {groupedBets.centenas.map((bet, index) => (
                            <View key={index} style={styles.fijoCorridoTableRow} collapsable={false}>
                                <View style={[styles.tableCell, { flex: 1.5 }]}>
                                    <View style={styles.circle} collapsable={false}>
                                        <Text category='s1' style={styles.circleText}>
                                            {bet.numbers[0]}
                                        </Text>
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
                )}

                {/* Fila 4: Otras Apuestas (Si las hay en un layout de bolita) */}
                {bets.filter(b => !['Fijo/Corrido', BET_TYPE_KEYS.PARLET, BET_TYPE_KEYS.CENTENA, BET_TYPE_KEYS.FIJO, BET_TYPE_KEYS.CORRIDO].includes(b.type)).length > 0 && (
                    <View style={styles.bolitaSection} collapsable={false}>
                        <View style={styles.divider} />
                        <Text category='s1' style={styles.sectionTitle}>OTRAS APUESTAS</Text>
                        {bets.filter(b => !['Fijo/Corrido', BET_TYPE_KEYS.PARLET, BET_TYPE_KEYS.CENTENA, BET_TYPE_KEYS.FIJO, BET_TYPE_KEYS.CORRIDO].includes(b.type)).map((bet, index) => (
                            <View key={bet.id || index} style={styles.betRow} collapsable={false}>
                                <View style={styles.betInfo}>
                                    <View style={styles.numbersContainer} collapsable={false}>
                                        {bet.numbers.map((num: string, idx: number) => (
                                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={styles.circle} collapsable={false}>
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
                    </View>
                )}
            </View>
        );
    };

    return (
        <Card style={styles.summaryCard} collapsable={false}>
            <View style={styles.summaryHeader} collapsable={false}>
                <View>
                    <Text category='s1' style={styles.summaryTitle}>Detalle de Apuestas</Text>
                    <Text category='s1' style={styles.receiptLabel}>
                        Recibo: <Text category='s1' style={styles.receiptCode}>{receiptCode}</Text>
                    </Text>
                </View>
                <Text category='c1' style={styles.drawIdLabel}>{`Sorteo ID: ${drawId || 'N/A'}`}</Text>
            </View>
            
            <View style={styles.divider} />

            {/* Nueva sección de Información del Sorteo */}
            <View style={styles.infoSection} collapsable={false}>
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

            {isBolita ? renderBolitaLayout() : bets.map((bet, index) => (
                <View key={bet.id || index} style={styles.betRow} collapsable={false}>
                    <View style={styles.betInfo}>
                        <View style={styles.numbersContainer} collapsable={false}>
                            {bet.numbers.map((num: string, idx: number) => (
                                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={styles.circle} collapsable={false}>
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

            <View style={styles.totalRow} collapsable={false}>
                <Text category='h6' style={styles.totalLabel}>Total</Text>
                <Text category='h6' status='primary' style={styles.totalAmount}>${totalAmount}</Text>
            </View>

            <View style={styles.divider} />

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer} collapsable={false}>
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
        marginBottom: 10,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryTitle: {
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
    },
    betType: {
        color: '#8F9BB3',
    },
    betAmount: {
        color: '#222B45',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    totalLabel: {
        color: '#222B45',
    },
    totalAmount: {
        fontWeight: 'bold',
    },
    disclaimerContainer: {
        paddingTop: 5,
    },
    disclaimerText: {
        textAlign: 'center',
        lineHeight: 16,
        fontSize: 11,
        fontStyle: 'italic',
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
    hyphen: {
        marginHorizontal: 4,
        color: '#8F9BB3',
        fontSize: 18,
    },
    bolitaContainer: {
        paddingTop: 10,
    },
    bolitaSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#8F9BB3',
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 15,
    },
    fijoCorridoTableHeader: {
        flexDirection: 'row',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    headerText: {
        color: '#8F9BB3',
        fontSize: 12,
        fontWeight: 'bold',
    },
    fijoCorridoTableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    tableCell: {
        alignItems: 'flex-start',
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
    parletCirclesRow: {
        flexDirection: 'row',
        gap: 4,
    },
    smallCircleText: {
        fontSize: 12,
        color: '#3366FF',
        fontWeight: 'bold',
    },
});
