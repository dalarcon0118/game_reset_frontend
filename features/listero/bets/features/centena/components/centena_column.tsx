import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import Colors from '@/constants/colors';
import AmountCircle from '../../../shared/components/amount_circle';
import BetCircle from '../../../shared/components/bet_circle';
import bottom_drawer from '@/components/ui/bottom_drawer';
import { BetNumericKeyboard, AmountNumericKeyboard } from '../../../shared/components/numeric_keyboard';
import { AnnotationType, AnnotationTypes } from '@/constants/bet';
import { useCentena } from '../use_centena';

interface CentenaColumnProps {
    editable?: boolean;
}

export const CentenaColumn: React.FC<CentenaColumnProps> = ({ editable = false }) => {
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
            <bottom_drawer isVisible={isVisible} onClose={onClose} height={"60%"} title=''>
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
            </bottom_drawer>
        );
    };

    const renderCentenaList = () => (
        <View style={styles.columnContent}>
            {centenaList.map((item) => (
                <View key={item.id} style={styles.centenaBlock}>
                    <BetCircle
                        value={item.bet.toString().padStart(3, '0')}
                        onPress={editable ? () => editCentenaBet(item.id) : undefined}
                    />
                    <AmountCircle 
                        amount={item.amount} 
                        onPress={editable ? () => editAmountKeyboard(item.id) : undefined} 
                    />
                </View>
            ))}
        </View>
    );

    return (
        <View style={[styles.column, styles.colCentena]}>
            {renderCentenaList()}

            {editable && (
                <View style={styles.columnContent}>
                    <View style={styles.centenaBlock}>
                        <BetCircle value={"+"} onPress={() => pressAddCentena()} />
                        <AmountCircle amount={"$"} />
                    </View>
                </View>
            )}
            {editable && renderKeyboard(AnnotationTypes.Bet)}
            {editable && renderKeyboard(AnnotationTypes.Amount)}
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
