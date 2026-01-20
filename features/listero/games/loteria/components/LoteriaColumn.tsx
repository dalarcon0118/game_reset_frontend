import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import AmountCircle from '@/features/listero/bets/shared/components/AmountCircle';
import BetCircle from '@/features/listero/bets/shared/components/BetCircle';
import BottomDrawer from '@/components/ui/BottomDrawer';
import { BetNumericKeyboard } from '@/features/listero/bets/shared/components/BetNumericKeyboard';
import { AmountNumericKeyboard } from '@/features/listero/bets/shared/components/AmountNumericKeyboard';
import { useLoteria } from '../useLoteria';
import StyledText from '@/components/typography/StyledText';

export const LoteriaColumn: React.FC = () => {
    const {
        loteriaList,
        fixedAmount,
        isBetKeyboardVisible,
        isAmountKeyboardVisible,
        currentInput,
        openBetKeyboard,
        closeBetKeyboard,
        openAmountKeyboard,
        closeAmountKeyboard,
        handleKeyPress,
        handleConfirmInput,
    } = useLoteria();

    const totalAmount = loteriaList.reduce((sum, item) => {
        // Prefer fixedAmount from rules if available, otherwise use item.amount
        const amount = (fixedAmount !== null && fixedAmount > 0) 
            ? fixedAmount 
            : (item.amount || 0);
        return sum + amount;
    }, 0);

    const renderKeyboard = () => {
        const isVisible = isBetKeyboardVisible || isAmountKeyboardVisible;
        const onClose = isBetKeyboardVisible ? closeBetKeyboard : closeAmountKeyboard;

        return (
            <BottomDrawer isVisible={isVisible} onClose={onClose} height={"60%"} title=''>
                {isBetKeyboardVisible ? (
                    <BetNumericKeyboard
                        onKeyPress={handleKeyPress}
                        onConfirm={handleConfirmInput}
                        currentInput={currentInput}
                        betType="loteria"
                        formatInput={formatLoteriaNumber}
                    />
                ) : (
                    <AmountNumericKeyboard
                        onKeyPress={handleKeyPress}
                        onConfirm={handleConfirmInput}
                        currentInput={currentInput}
                    />
                )}
            </BottomDrawer>
        );
    };

    const getLoteriaGroups = (num: number | string): string[] => {
        const s = String(num);
        if (!s || !/^\d+$/.test(s)) return [];
        
        // Formato (X)-(XX)-(XX) agrupando de derecha a izquierda
        const reversed = s.split('').reverse().join('');
        const matches = reversed.match(/.{1,2}/g);
        if (!matches) return [s];
        
        return matches.map(m => m.split('').reverse().join('')).reverse();
    };

    const formatLoteriaNumber = (num: string): string => {
        const groups = getLoteriaGroups(num);
        if (groups.length === 0) return '';
        return groups.map(g => `(${g})`).join('-');
    };

    const renderLoteriaCircles = (num: number | string) => {
        const groups = getLoteriaGroups(num);
        return (
            <View style={styles.circlesContainer}>
                {groups.map((group, index) => (
                    <React.Fragment key={`${num}-${index}`}>
                        <BetCircle
                            value={group}
                            onPress={() => {}} // Could add edit bet logic later
                        />
                        
                    </React.Fragment>
                ))}
            </View>
        );
    };

    const hasFixedAmount = fixedAmount !== null && fixedAmount > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <StyledText style={styles.headerText}>Número</StyledText>
                {!hasFixedAmount && (
                    <StyledText style={styles.headerText}>Monto</StyledText>
                )}
                {hasFixedAmount && (
                    <StyledText style={styles.priceLabel}>Precio: ${fixedAmount}</StyledText>
                )}
            </View>
            
            <View style={styles.listContent}>
                {loteriaList.map((item) => (
                    <View key={item.id} style={[styles.betRow, hasFixedAmount && styles.betRowCentered]}>
                        {renderLoteriaCircles(item.bet)}
                        {!hasFixedAmount && (
                            <AmountCircle
                                amount={item.amount || 0}
                                onPress={() => openAmountKeyboard(item.id)}
                            />
                        )}
                    </View>
                ))}
                
                <View style={[styles.betRow, hasFixedAmount && styles.betRowCentered]}>
                    <BetCircle 
                        value={"+"} 
                        onPress={openBetKeyboard} 
                    />
                </View>

                {loteriaList.length > 0 && (
                    <View style={styles.totalRow}>
                        <StyledText style={styles.totalLabel}>Total:</StyledText>
                        <StyledText style={styles.totalValue}>${totalAmount}</StyledText>
                    </View>
                )}
            </View>

            {renderKeyboard()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Layout.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: Layout.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        marginBottom: Layout.spacing.sm,
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.light.text,
    },
    priceLabel: {
        fontSize: 14,
        color: Colors.light.tint,
        fontWeight: '600',
    },
    listContent: {
        paddingVertical: Layout.spacing.xs,
    },
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
    separator: {
        marginHorizontal: 8,
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: Layout.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        marginTop: Layout.spacing.sm,
        paddingRight: Layout.spacing.lg,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginRight: Layout.spacing.sm,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.tint,
    },
});
