import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import Colors from '@/constants/colors';
import AmountCircle from '@/shared/components/bets/amount_circle';
import BetCircle from '@/shared/components/bets/bet_circle';
import { useCentena } from '../hooks/use_centena';

interface CentenaColumnProps {
    editable?: boolean;
    data?: any[];
}

export const CentenaColumn: React.FC<CentenaColumnProps> = ({ editable = false, data }) => {
    const {
        centenaList: hookList,
        editCentenaBet,
        editAmountKeyboard,
        pressAddCentena,
    } = useCentena();

    const centenaList = data || hookList;

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
