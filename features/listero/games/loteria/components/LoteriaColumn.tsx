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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <StyledText style={styles.headerText}>Número</StyledText>
                <StyledText style={styles.headerText}>Monto</StyledText>
            </View>
            
            <View style={styles.listContent}>
                {loteriaList.map((item) => (
                    <View key={item.id} style={styles.betRow}>
                        <BetCircle
                            value={item.bet.toString().padStart(4, '0')}
                            onPress={() => {}} // Could add edit bet logic later
                        />
                        <AmountCircle 
                            amount={item.amount} 
                            onPress={() => openAmountKeyboard(item.id)} 
                        />
                    </View>
                ))}
                
                <View style={styles.betRow}>
                    <BetCircle 
                        value={"+"} 
                        onPress={openBetKeyboard} 
                    />
                    <AmountCircle amount={null} onPress={() => {}} />
                </View>
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
    },
    listContent: {
        paddingVertical: Layout.spacing.xs,
    },
    betRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
    },
});
