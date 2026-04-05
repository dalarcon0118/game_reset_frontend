import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';

interface StandardNumbersProps {
    numbers: string[];
}

export const StandardNumbers: React.FC<StandardNumbersProps> = ({ numbers }) => {
    return (
        <View style={styles.container} collapsable={false}>
            {numbers.map((num: string, idx: number) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.circle} collapsable={false}>
                        <Text category='s1' style={styles.circleText}>{num}</Text>
                    </View>
                    {idx < numbers.length - 1 && (
                        <Text style={styles.hyphen}>-</Text>
                    )}
                </View>
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
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#3366FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleText: {
        color: '#3366FF',
        fontWeight: 'bold',
    },
    hyphen: {
        marginHorizontal: 4,
        color: '#8F9BB3',
        fontSize: 18,
    },
});