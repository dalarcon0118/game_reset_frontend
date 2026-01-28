import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { GameTypeCodes } from '@/constants/bet';

interface NumberDisplayProps {
    numbers: number[] | string;
    gameTypeCode?: GameTypeCodes | string;
    annotationType?: 'bet' | 'amount';
}

export const NumberDisplay: React.FC<NumberDisplayProps> = ({
    numbers,
    gameTypeCode = 'fijo',
    annotationType = 'bet'
}) => {
    // Convert string to array if needed
    const numbersArray = typeof numbers === 'string'
        ? numbers.split('').map(n => parseInt(n, 10)).filter(n => !isNaN(n))
        : numbers;

    const formatNumber = (num: number): string => {
        // Format based on game type
        if (gameTypeCode === 'centena') {
            return num.toString().padStart(3, '0');
        }
        return num.toString().padStart(2, '0');
    };

    if (numbersArray.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.placeholder}>No hay números</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {annotationType === 'bet' ? (
                <View style={styles.numbersRow}>
                    {numbersArray.map((num, index) => (
                        <View key={index} style={styles.numberBadge}>
                            <Text style={styles.numberText}>{formatNumber(num)}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.amountText}>
                    {numbersArray.map(n => formatNumber(n)).join(' - ')}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        backgroundColor: '#F7F9FC',
        borderRadius: 8,
        marginBottom: 8,
    },
    numbersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    numberBadge: {
        backgroundColor: '#E8F4FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    numberText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1565C0',
    },
    placeholder: {
        fontSize: 14,
        color: '#90A4AE',
        fontStyle: 'italic',
    },
    amountText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#37474F',
    },
});
