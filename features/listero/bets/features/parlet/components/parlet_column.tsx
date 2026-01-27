import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import Colors from '@/constants/colors';
import AmountCircle from '../../../shared/components/amount_circle';
import BetCircle from '../../../shared/components/bet_circle';
import { FijosCorridosBet } from '@/types';
import bottom_drawer from '@/components/ui/bottom_drawer';
import { BetNumericKeyboard, AmountNumericKeyboard } from '../../../shared/components/numeric_keyboard';
import { AnnotationType, AnnotationTypes } from '@/constants/bet';
import { useParlet } from '../use_parlet';

interface ParletColumnProps {
    fijosCorridosList: FijosCorridosBet[];
    editable?: boolean;
}

export const ParletColumn: React.FC<ParletColumnProps> = ({ fijosCorridosList, editable = false }) => {
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
            <bottom_drawer isVisible={isVisible} onClose={onClose} height={"60%"} title=''>
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
            </bottom_drawer>
        );
    };
    const renderParletList = () => (
        <View style={styles.columnContent}>
            {parletList.map((item) => (
                <View key={item.id} style={styles.parletBlock}>
                    <View style={styles.parletNumbers}>
                        {item.bets.map((bet: number, index: number) => (
                            <View key={index} style={styles.circleWrapper}>
                                <BetCircle 
                                    value={bet.toString().padStart(2, '0')} 
                                    onPress={editable ? () => editParletBet(item.id) : undefined} 
                                />
                            </View>
                        ))}
                    </View>
                    <AmountCircle 
                        amount={item.amount} 
                        onPress={editable ? () => editAmountKeyboard(item.id) : undefined} 
                    />
                </View>
            ))}
        </View>
    );

    return (
        <View style={[styles.column, styles.colParlet]}>
            {renderParletList()}

            {editable && (
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
            )}
            {editable && renderKeyboard(AnnotationTypes.Bet)}
            {editable && renderKeyboard(AnnotationTypes.Amount)}
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
