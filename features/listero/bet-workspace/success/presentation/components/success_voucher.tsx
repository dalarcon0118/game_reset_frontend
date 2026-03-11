import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@/shared/components';
import { FormattedBet, VoucherMetadata } from '../../core/domain/success.types';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';
import BetCircle from '@/shared/components/bets/bet_circle';

// Helper function to check if a bet is Loteria or Cuaterna type
const isLoteriaBet = (betType: string): boolean => {
    const normalized = betType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('loteria') || normalized.includes('cuaterna');
};

// Split a single number string into groups based on schema [1, 2, 2]
// Example: "25687" -> ["2", "56", "87"]
const splitLoteriaNumber = (numStr: string): string[] => {
    // Schema: [1, 2, 2] for Loteria/Cuaterna
    const schema = [1, 2, 2];
    const result: string[] = [];
    let start = 0;
    
    for (const len of schema) {
        if (start < numStr.length) {
            result.push(numStr.slice(start, start + len));
            start += len;
        }
    }
    
    return result;
};

// Format numbers for Loteria/Cuaterna bets using 3 BetCircles: (X)(XX)(XX)
const renderLoteriaNumbers = (numbers: string[]) => {
    // If single number string like "25687", split it into 3 groups
    const groups = numbers.length === 1 && numbers[0].length === 5 
        ? splitLoteriaNumber(numbers[0]) 
        : numbers;
    
    return (
        <View style={styles.loteriaContainer} collapsable={false}>
            {groups.map((num, idx) => (
                <React.Fragment key={idx}>
                    <BetCircle value={num} />
                    {idx < groups.length - 1 && (
                        <Text style={styles.loteriaHyphen}></Text>
                    )}
                </React.Fragment>
            ))}
        </View>
    );
};

// Format numbers for standard (non-Loteria) bets with circles
const renderStandardNumbers = (numbers: string[]) => {
    return (
        <View style={styles.numbersContainer} collapsable={false}>
            {numbers.map((num: string, idx: number) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.circle} collapsable={false}>
                        <Text category='s1' style={styles.circleText}>{num}</Text>
                    </View>
                    {idx < numbers.length - 1 && (
                        <Text style={styles.hyphen}>-</Text>
                    )}
                </View>
            ))}
        </View>
    );
};

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
    const isAnyLoteria = bets.some(b => isLoteriaBet(b.type));
    const loteriaPrize = "$ 2,000,000.00";
    
    // Get current time for the receipt
    const currentTime = new Date().toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

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
                {isAnyLoteria && (
                    <View style={styles.infoRow}>
                        <Text category='c1' style={styles.infoLabel}>Hora Emisión:</Text>
                        <Text category='c1' style={styles.infoValue}>{currentTime}</Text>
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
                        {isAnyLoteria ? loteriaPrize : metadata.totalPrize}
                    </Text>
                </View>
            </View>
            
            <View style={styles.divider} />

            {isAnyLoteria && (
                <View style={styles.loteriaInfoBox} collapsable={false}>
                    <Text category='c1' style={styles.loteriaInfoText}>
                        * En caso de múltiples ganadores con el mismo número premiado, el premio mayor se dividirá en partes iguales entre todos los ganadores.
                    </Text>
                    <Text category='c1' style={styles.loteriaWebLink}>
                        Consulta ganadores en: game-reset.com
                    </Text>
                </View>
            )}

            {isBolita ? renderBolitaLayout() : bets.map((bet, index) => (
                <View key={bet.id || index} style={styles.betRow} collapsable={false}>
                    <View style={styles.betInfo}>
                        {isLoteriaBet(bet.type) 
                            ? renderLoteriaNumbers(bet.numbers) 
                            : renderStandardNumbers(bet.numbers)
                        }
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
    loteriaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    loteriaHyphen: {
        marginHorizontal: 2,
        color: '#8F9BB3',
        fontSize: 16,
    },
    loteriaInfoBox: {
        backgroundColor: '#F7F9FC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#3366FF',
    },
    loteriaInfoText: {
        color: '#222B45',
        fontSize: 11,
        lineHeight: 16,
        fontStyle: 'italic',
    },
    loteriaWebLink: {
        color: '#3366FF',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 6,
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
