import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import AmountCircle from '../../../shared/components/AmountCircle';
import BetCircle from '../../../shared/components/BetCircle';
import { FijosCorridosBet } from '@/types';
import BottomDrawer from '@/components/ui/BottomDrawer';
import { NumericKeyboard } from '../../../shared/components/NumericKeyboard';
import { AnnotationType, AnnotationTypes, GameTypes } from '@/constants/Bet';
import { useParlet } from '../useParlet';

interface ParletColumnProps {
    fijosCorridosList: FijosCorridosBet[];
}

export const ParletColumn: React.FC<ParletColumnProps> = ({ fijosCorridosList }) => {
    const {
        parletList,
        editingAmountType,
        isParletDrawerVisible,
        isAmmountDrawerVisible,
        fromFijosyCorridoBet,
        potentialParletNumbers,
        value,
        cancelParletBet,
        confirmParletBet,
        editParletBet,
        editAmmountKeyboard,
        pressAddParlet,
        showParletDrawer,
        showAmmountDrawer,
        processBetInput,
        processAmountInput
    } = useParlet(fijosCorridosList);

    useEffect(() => {
        if (fromFijosyCorridoBet) {
            Alert.alert(
                "Desea Agregar estos numeros como parlet?",
                `Lista de numeros [${potentialParletNumbers.join(', ')}] como parlet?`,
                [
                    { text: "Cancel", onPress: cancelParletBet, style: "cancel" },
                    { text: "OK", onPress: confirmParletBet }
                ]
            );
        }
    }, [fromFijosyCorridoBet, potentialParletNumbers, cancelParletBet, confirmParletBet]);

    const renderKeyboard = (annotationType: AnnotationType) => {
        const isVisible = annotationType === AnnotationTypes.Amount
            ? isAmmountDrawerVisible && editingAmountType === 'parlet'
            : isParletDrawerVisible;
        const onClose = annotationType === AnnotationTypes.Amount
            ? () => showAmmountDrawer()
            : () => showParletDrawer();
        const onNumberPress = (number: string) =>
            annotationType === AnnotationTypes.Amount
                ? processAmountInput(number)
                : processBetInput(number);

        return (
            <BottomDrawer isVisible={isVisible} onClose={onClose} height={"55%"} title=''>
                <NumericKeyboard
                    onNumberPress={onNumberPress}
                    annotationType={annotationType}
                    gameType={GameTypes.PARLET}
                />
            </BottomDrawer>
        );
    };

    return (
        <View style={[styles.column, styles.colParlet]}>
            <View style={styles.columnContent}>
                {parletList.map((item) => (
                    <View key={item.id} style={styles.parletBlock}>
                        <View style={styles.parletNumbers}>
                            {item.bets.map((bet: number, index: number) => (
                                <BetCircle key={index} value={bet.toString().padStart(2, '0')} onPress={() => editParletBet(item.id)} />
                            ))}
                        </View>
                        <AmountCircle amount={item.amount} onPress={() => editAmmountKeyboard(item.id)} />
                    </View>
                ))}
            </View>

            <View style={styles.columnContent}>
                <View style={styles.parletBlock}>
                    <View style={styles.parletNumbers}>
                        <BetCircle value={"+"} onPress={() => pressAddParlet()} />
                    </View>
                    <AmountCircle amount={"$"} />
                </View>
            </View>
            {renderKeyboard(AnnotationTypes.Bet)}
            {renderKeyboard(AnnotationTypes.Amount)}
        </View>
    );
};

const styles = StyleSheet.create({
    column: {
        borderRightWidth: 1,
        borderRightColor: Colors.light.border,
        flex: 1,
    },
    colParlet: {
        flex: 2,
        paddingHorizontal: Layout.spacing.xs,
    },
    columnContent: {
        paddingVertical: Layout.spacing.xs,
    },
    parletBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        paddingVertical: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.xs,
        minHeight: 60,
    },
    parletNumbers: {
        flex: 1,
        marginRight: Layout.spacing.xs,
    },
});
