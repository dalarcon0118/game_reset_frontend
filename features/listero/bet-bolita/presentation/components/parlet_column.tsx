import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import Colors from '@/constants/colors';
import AmountCircle from '@/shared/components/bets/amount_circle';
import BetCircle from '@/shared/components/bets/bet_circle';
import { FijosCorridosBet, ParletBet } from '@/types';
import { useParlet } from '../hooks/use_parlet';

interface ParletColumnProps {
    fijosCorridosList: FijosCorridosBet[];
    editable?: boolean;
    data?: ParletBet[];
}

export const ParletColumn: React.FC<ParletColumnProps> = ({ fijosCorridosList, editable = false, data }) => {
    const {
        parletList: hookList,
        editParletBet,
        editAmountKeyboard,
        pressAddParlet,
    } = useParlet(fijosCorridosList);

    const parletList = data || hookList;

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
                        <BetCircle value={"+"} onPress={() => pressAddParlet()} />
                        <AmountCircle amount={"$"} />
                    </View>
                </View>
            )}
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
