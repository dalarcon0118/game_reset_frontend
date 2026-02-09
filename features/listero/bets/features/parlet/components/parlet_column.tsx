import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import Colors from '@/constants/colors';
import AmountCircle from '../../../shared/components/amount_circle';
import BetCircle from '../../../shared/components/bet_circle';
import { FijosCorridosBet, ParletBet } from '@/types';
import { BetNumericKeyboard, AmountNumericKeyboard } from '../../../shared/components/numeric_keyboard';
import { AnnotationType, AnnotationTypes } from '@/constants/bet';
import { useParlet } from '../use_parlet';
import { PARLET_EDITING_TYPE } from '../parlet.types';
import BottomDrawer from '@/components/ui/bottom_drawer';

interface ParletColumnProps {
    fijosCorridosList: FijosCorridosBet[];
    editable?: boolean;
    data?: ParletBet[];
}

export const ParletColumn: React.FC<ParletColumnProps> = ({ fijosCorridosList, editable = false, data }) => {
    const {
        parletList: hookList,
        editingAmountType,
        currentInput,
        showAmountKeyboard,
        showBetKeyboard,
        isParletDrawerVisible,
        editParletBet,
        editAmountKeyboard,
        pressAddParlet,
        showParletDrawer,
        showAmountDrawer,
        hideAmountKeyboard,
        hideBetKeyboard,
        handleKeyPress,
        handleConfirmInput,
    } = useParlet(fijosCorridosList);

    const parletList = data || hookList;

    const renderKeyboard = (annotationType: AnnotationType) => {
        const isVisible = annotationType === AnnotationTypes.Amount
            ? showAmountKeyboard && editingAmountType === PARLET_EDITING_TYPE
            : (showBetKeyboard && editingAmountType === PARLET_EDITING_TYPE) || isParletDrawerVisible;
        const onClose = annotationType === AnnotationTypes.Amount
            ? () => hideAmountKeyboard()
            : () => {
                if (showBetKeyboard) hideBetKeyboard();
                if (isParletDrawerVisible) showParletDrawer(false);
            };

        if (!isVisible) return null;

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
            {parletList.map((item: ParletBet) => (
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
