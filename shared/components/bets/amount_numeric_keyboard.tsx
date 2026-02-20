import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { Delete } from 'lucide-react-native';

interface AmountNumericKeyboardProps {
    onNumberPress?: (number: string) => void;
    onKeyPress?: (key: string) => void;
    currentInput?: string;
    onConfirm?: () => void;
}

export const AmountNumericKeyboard: React.FC<AmountNumericKeyboardProps> = ({
    onNumberPress,
    onKeyPress,
    currentInput = '',
    onConfirm,
}) => {
    const theme = useTheme();

    const handlePress = (key: string) => {
        if (onNumberPress) onNumberPress(key);
        if (onKeyPress) onKeyPress(key);
    };

    const renderKey = (value: string | React.ReactNode, key: string, style?: any) => (
        <TouchableOpacity
            key={key}
            style={[styles.keyButton, { backgroundColor: theme['background-basic-color-2'] }, style]}
            onPress={() => key === 'confirm' ? onConfirm?.() : handlePress(key === 'delete' ? 'backspace' : key)}
            activeOpacity={0.7}
        >
            {typeof value === 'string' ? <Text category="h6" style={style?.color ? { color: style.color } : {}}>{value}</Text> : value}
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
            <View style={{ width: '30%' }} />
            {renderKey('0', '0')}
            {renderKey(<Delete size={24} color={theme['text-basic-color']} />, 'delete')}
        </View>
    );

    const confirmButton = (
        <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme['color-primary-500'] }]}
            onPress={onConfirm}
            activeOpacity={0.8}
        >
            <Text style={styles.confirmText}>Confirmar</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.keyboard}>
            <View style={[styles.displayContainer, { backgroundColor: theme['background-basic-color-3'] }]}>
                <Text category="h5" style={styles.displayText}>
                    {currentInput || 'Introducir Monto'}
                </Text>
            </View>
            {rows.map((row, idx) => (
                <View key={`row-${idx}`} style={styles.keyboardRow}>
                    {row.map((key) => renderKey(key as string, key as string))}
                </View>
            ))}
            {bottomRow}
            {confirmButton}
        </View>
    );
};

const styles = StyleSheet.create({
    keyboard: { width: '100%', paddingHorizontal: 8, marginTop: 8 },
    displayContainer: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        minHeight: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    displayText: {
        textAlign: 'center',
    },
    keyboardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    keyButton: { width: '30%', aspectRatio: 1.8, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    confirmButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});