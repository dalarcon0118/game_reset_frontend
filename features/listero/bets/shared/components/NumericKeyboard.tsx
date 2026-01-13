import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { X, Delete } from 'lucide-react-native';

interface NumericKeyboardProps {
    onNumberPress: (number: string) => void;
    annotationType?: 'bet' | 'amount';
    gameType?: string;
    onKeyPress?: (key: string) => void;
    allowWildcard?: boolean;
}

export const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
    onNumberPress,
    onKeyPress,
    allowWildcard = false,
}) => {
    const theme = useTheme();

    const handlePress = (key: string) => {
        if (onNumberPress) onNumberPress(key);
        if (onKeyPress) onKeyPress(key);
    };

    const renderKey = (value: string | React.ReactNode, key: string) => (
        <TouchableOpacity
            key={key}
            style={[styles.keyButton, { backgroundColor: theme['background-basic-color-2'] }]}
            onPress={() => handlePress(key)}
            activeOpacity={0.7}
        >
            {typeof value === 'string' ? <Text category="h6">{value}</Text> : value}
        </TouchableOpacity>
    );

    const keys: (string | React.ReactNode)[] = [];
    for (let i = 1; i <= 9; i++) {
        keys.push(i.toString());
    }

    const rows: (string | React.ReactNode)[][] = [];
    for (let i = 0; i < keys.length; i += 3) {
        rows.push(keys.slice(i, i + 3) as string[]);
    }

    const bottomRow = (
        <View key="bottom-row" style={styles.keyboardRow}>
            {allowWildcard && renderKey(<X size={24} color={theme['text-basic-color']} />, 'X')}
            {renderKey('0', '0')}
            {renderKey(<Delete size={24} color={theme['text-basic-color']} />, 'delete')}
        </View>
    );

    return (
        <View style={styles.keyboard}>
            {rows.map((row, idx) => (
                <View key={`row-${idx}`} style={styles.keyboardRow}>
                    {row.map((key) => renderKey(key as string, key as string))}
                </View>
            ))}
            {bottomRow}
        </View>
    );
};

export const CustomNumericKeyboard = NumericKeyboard;

const styles = StyleSheet.create({
    keyboard: { width: '100%', paddingHorizontal: 8, marginTop: 16 },
    keyboardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    keyButton: { width: '30%', aspectRatio: 1.5, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
});
