import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { X, Delete } from 'lucide-react-native';

interface CustomNumericKeyboardProps {
  onKeyPress: (key: string) => void;
  allowWildcard?: boolean;
}

export default function CustomNumericKeyboard({
  onKeyPress,
  allowWildcard = false,
}: CustomNumericKeyboardProps) {
  const theme = useTheme();

  const renderKey = (value: string | React.ReactNode, key: string) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.keyButton,
        {
          backgroundColor: theme['background-basic-color-2'],
        },
      ]}
      onPress={() => onKeyPress(key)}
      activeOpacity={0.7}
    >
      {typeof value === 'string' ? (
        <Text category="h6">{value}</Text>
      ) : (
        value
      )}
    </TouchableOpacity>
  );

  const renderNumericKeys = () => {
    const keys = [];
    // Numbers 1-9
    for (let i = 1; i <= 9; i++) {
      keys.push(renderKey(i.toString(), i.toString()));
    }
    
    // Special bottom row with 0, X, and Delete
    const bottomRow = (
      <View key="bottom-row" style={styles.keyboardRow}>
        {allowWildcard && 
          renderKey(<X size={24} color={theme['text-basic-color']} />, 'X')
        }
        {renderKey('0', '0')}
        {renderKey(
          <Delete size={24} color={theme['text-basic-color']} />, 
          'delete'
        )}
      </View>
    );

    // Create rows of 3 keys each
    const rows = [];
    for (let i = 0; i < keys.length; i += 3) {
      rows.push(
        <View key={`row-${i}`} style={styles.keyboardRow}>
          {keys.slice(i, i + 3)}
        </View>
      );
    }

    return [...rows, bottomRow];
  };

  return <View style={styles.keyboard}>{renderNumericKeys()}</View>;
}

const styles = StyleSheet.create({
  keyboard: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyButton: {
    width: '30%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
});