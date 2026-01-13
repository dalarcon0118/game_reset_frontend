import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@ui-kitten/components';

interface QuickAmountButtonsProps {
    amounts: number[];
    onSelectAmount: (amount: number) => void;
}

export const QuickAmountButtons: React.FC<QuickAmountButtonsProps> = ({ amounts, onSelectAmount }) => {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {amounts.slice(0, 3).map((amount) => (
                    <TouchableOpacity
                        key={`amount-${amount}`}
                        style={styles.button}
                        onPress={() => onSelectAmount(amount)}
                    >
                        <Text category="s2">${amount}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.row}>
                {amounts.slice(3).map((amount) => (
                    <TouchableOpacity
                        key={`amount-${amount}`}
                        style={styles.button}
                        onPress={() => onSelectAmount(amount)}
                    >
                        <Text category="s2">${amount}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', marginTop: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    button: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8E8E93',
        marginHorizontal: 4,
    },
});
