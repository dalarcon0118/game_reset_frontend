import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { X, Delete } from 'lucide-react-native';

interface CustomNumericKeyboardProps {
    onKeyPress: (key: string) => void;
    allowWildcard?: boolean;
}

export const CustomNumericKeyboard: React.FC<CustomNumericKeyboardProps> = ({
    onKeyPress,
    allowWildcard = false,
}) => {
    const theme = useTheme();

    const renderKey = (value: string | React.ReactNode, key: string) => (
        <TouchableOpacity
            key={key}
            style={[styles.keyButton, { backgroundColor: theme['background-basic-color-2'] }]}
            onPress={() => onKeyPress(key)}
            activeOpacity={0.7}
        >
            {typeof value === 'string' ? <Text category="h6">{value}</Text> : value}
        </TouchableOpacity>
    );

    const keys = [];
    for (let i = 1; i <= 9; i++) {
        keys.push(renderKey(i.toString(), i.toString()));
    }

    const rows = [];
    for (let i = 0; i < keys.length; i += 3) {
        rows.push(<View key={`row-${i}`} style={styles.keyboardRow}>{keys.slice(i, i + 3)}</View>);
    }

    const bottomRow = (
        <View key="bottom-row" style={styles.keyboardRow}>
            {allowWildcard && renderKey(<X size={24} color={theme['text-basic-color']} />, 'X')}
            {renderKey('0', '0')}
            {renderKey(<Delete size={24} color={theme['text-basic-color']} />, 'delete')}
        </View>
    );

    return <View style={styles.keyboard}>{[...rows, bottomRow]}</View>;
};

const styles = StyleSheet.create({
    keyboard: { width: '100%', paddingHorizontal: 8, marginTop: 16 },
    keyboardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    keyButton: { width: '30%', aspectRatio: 1.5, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
});
