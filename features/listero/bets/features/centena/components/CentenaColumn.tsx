import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import AmountCircle from '../../../shared/components/AmountCircle';
import BetCircle from '../../../shared/components/BetCircle';
import BottomDrawer from '@/components/ui/BottomDrawer';
import { BetNumericKeyboard, AmountNumericKeyboard } from '../../../shared/components/NumericKeyboard';
import { AnnotationType, AnnotationTypes } from '@/constants/Bet';
import { useCentena } from '../useCentena';

export const CentenaColumn: React.FC = () => {
    const {
        centenaList,
        editingAmountType,
        currentInput,
        isCentenaDrawerVisible,
        isAmountDrawerVisible,
        editCentenaBet,
        editAmountKeyboard,
        pressAddCentena,
        showCentenaDrawer,
        showAmountDrawer,
        handleKeyPress,
        handleConfirmInput,
    } = useCentena();

    const renderKeyboard = (annotationType: AnnotationType) => {
        const isVisible = annotationType === AnnotationTypes.Amount
            ? isAmountDrawerVisible && editingAmountType === 'centena'
            : isCentenaDrawerVisible;
        const onClose = annotationType === AnnotationTypes.Amount
            ? () => showAmountDrawer(false)
            : () => showCentenaDrawer(false);

        return (
            <BottomDrawer isVisible={isVisible} onClose={onClose} height={"60%"} title=''>
                {annotationType === AnnotationTypes.Bet ? (
                    <BetNumericKeyboard
                        onKeyPress={handleKeyPress}
                        onConfirm={handleConfirmInput}
                        currentInput={currentInput}
                        betType="centena"
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

    const renderCentenaList = () => (
        <View style={styles.columnContent}>
            {centenaList.map((item) => (
                <View key={item.id} style={styles.centenaBlock}>
                    <BetCircle
                        value={item.bet.toString().padStart(3, '0')}
                        onPress={() => editCentenaBet(item.id)}
                    />
                    <AmountCircle amount={item.amount} onPress={() => editAmountKeyboard(item.id)} />
                </View>
            ))}
        </View>
    );

    return (
        <View style={[styles.column, styles.colCentena]}>
            {renderCentenaList()}

            <View style={styles.columnContent}>
                <View style={styles.centenaBlock}>
                    <BetCircle value={"+"} onPress={() => pressAddCentena()} />
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
    colCentena: {
        flex: 2,
        paddingHorizontal: Layout.spacing.xs,
    },
    columnContent: {
        paddingVertical: Layout.spacing.xs,
    },
    centenaBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        paddingVertical: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.xs,
        minHeight: 60,
    },
});
