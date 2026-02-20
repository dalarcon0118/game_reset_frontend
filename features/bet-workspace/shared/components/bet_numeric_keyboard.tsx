import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { X, Delete } from 'lucide-react-native';

type BetType = 'fijo-corrido' | 'parlet' | 'centena' | 'loteria';

interface BetNumericKeyboardProps {
    onNumberPress?: (number: string) => void;
    onKeyPress?: (key: string) => void;
    allowWildcard?: boolean;
    currentInput?: string;
    onConfirm?: () => void;
    betType?: BetType;
    formatInput?: (input: string) => string;
}

export const BetNumericKeyboard: React.FC<BetNumericKeyboardProps> = ({
    onNumberPress,
    onKeyPress,
    allowWildcard = false,
    currentInput = '',
    onConfirm,
    betType = 'fijo-corrido',
    formatInput,
}) => {
    const theme = useTheme();

    const handlePress = (key: string) => {
        if (onNumberPress) onNumberPress(key);
        if (onKeyPress) onKeyPress(key);
    };

    const formatBetInput = (input: string) => {
        if (!input || !/^\d+$/.test(input)) return '';
        if (formatInput) return formatInput(input);

        switch (betType) {
            case 'centena':
                // Format centena bets as three-digit numbers (123)
                const centenaMatches = input.match(/.{1,3}/g);
                if (!centenaMatches) return '';
                return centenaMatches.map(m => `(${m})`).join(' ');
            case 'loteria':
                // Format loteria bets as four-digit numbers (1234)
                const loteriaMatches = input.match(/.{1,4}/g);
                if (!loteriaMatches) return '';
                return loteriaMatches.map(m => `(${m})`).join(' ');
            case 'fijo-corrido':
            case 'parlet':
            default:
                // Format bets as pairs (15)-(25)
                const matches = input.match(/.{1,2}/g);
                if (!matches) return '';
                return matches.map(m => `(${m})`).join('-');
        }
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
            {allowWildcard ? renderKey(<X size={24} color={theme['text-basic-color']} />, 'X') : <View style={{ width: '30%' }} />}
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
                    {formatBetInput(currentInput) || 
                      (betType === 'centena' ? 'Introducir Centenas' : 
                       betType === 'loteria' ? 'Introducir Lotería' : 
                       'Introducir Apuestas')}
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
