import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import AmountCircle from '../../../shared/components/AmountCircle';
import BetCircle from '../../../shared/components/BetCircle';
import { FijosCorridosBet } from '@/types';
import BottomDrawer from '@/components/ui/BottomDrawer';
import { BetNumericKeyboard, AmountNumericKeyboard } from '../../../shared/components/NumericKeyboard';
import { AnnotationType, AnnotationTypes } from '@/constants/Bet';
import { useParlet } from '../useParlet';

interface ParletColumnProps {
    fijosCorridosList: FijosCorridosBet[];
}

export const ParletColumn: React.FC<ParletColumnProps> = ({ fijosCorridosList }) => {
    const {
        parletList,
        editingAmountType,
        currentInput,
        isParletDrawerVisible,
        isAmountDrawerVisible,
        editParletBet,
        editAmountKeyboard,
        pressAddParlet,
        showParletDrawer,
        showAmountDrawer,
        handleKeyPress,
        handleConfirmInput,
    } = useParlet(fijosCorridosList);

    const renderKeyboard = (annotationType: AnnotationType) => {
        const isVisible = annotationType === AnnotationTypes.Amount
            ? isAmountDrawerVisible && editingAmountType === 'parlet'
            : isParletDrawerVisible;
        const onClose = annotationType === AnnotationTypes.Amount
            ? () => showAmountDrawer(false)
            : () => showParletDrawer(false);

        return (
            <BottomDrawer isVisible={isVisible} onClose={onClose} height={"60%"} title=''>
                {annotationType === AnnotationTypes.Bet ? (
                    <BetNumericKeyboard
                        onKeyPress={handleKeyPress}
                        onConfirm={handleConfirmInput}
                        currentInput={currentInput}
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
    const renderParletList = () => (
        <View style={styles.columnContent}>
            {parletList.map((item) => (
                <View key={item.id} style={styles.parletBlock}>
                    <View style={styles.parletNumbers}>
                        {item.bets.map((bet: number, index: number) => (
                            <View key={index} style={styles.circleWrapper}>
                                <BetCircle value={bet.toString().padStart(2, '0')} onPress={() => editParletBet(item.id)} />
                            </View>
                        ))}
                    </View>
                    <AmountCircle amount={item.amount} onPress={() => editAmountKeyboard(item.id)} />
                </View>
            ))}
        </View>
    );

    return (
        <View style={[styles.column, styles.colParlet]}>
            {renderParletList()}

            <View style={styles.columnContent}>
                <View style={styles.parletBlock}>
                    <View style={styles.parletNumbers}>
                        <View style={styles.circleWrapper}>
                            <BetCircle value={"+"} onPress={() => pressAddParlet()} />
                        </View>
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
    },
    colParlet: {
        flex: 3,
        paddingHorizontal: Layout.spacing.sm,
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginRight: Layout.spacing.sm,
    },
    circleWrapper: {
        margin: 5,
        marginLeft: -8,
    },
});
