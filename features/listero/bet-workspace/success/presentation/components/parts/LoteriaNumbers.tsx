import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import BetCircle from '@/shared/components/bets/bet_circle';

interface LoteriaNumbersProps {
    numbers: string[];
}

const splitLoteriaNumber = (numStr: string): string[] => {
    const schema = [1, 2, 2];
    const result: string[] = [];
    let start = 0;

    for (const len of schema) {
        if (start < numStr.length) {
            result.push(numStr.slice(start, start + len));
            start += len;
        }
    }

    return result;
};

export const LoteriaNumbers: React.FC<LoteriaNumbersProps> = ({ numbers }) => {
    const groups = numbers.length === 1 && numbers[0].length === 5
        ? splitLoteriaNumber(numbers[0])
        : numbers;

    return (
        <View style={styles.container} collapsable={false}>
            {groups.map((num, idx) => (
                <React.Fragment key={idx}>
                    <BetCircle value={num} />
                    {idx < groups.length - 1 && (
                        <Text style={styles.hyphen}>-</Text>
                    )}
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    hyphen: {
        marginHorizontal: 2,
        color: '#8F9BB3',
        fontSize: 16,
    },
});