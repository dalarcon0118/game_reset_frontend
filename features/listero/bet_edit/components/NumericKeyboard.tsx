import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@ui-kitten/components';
import { ArrowUpDown } from 'lucide-react-native';

interface NumericKeyboardProps {
  isRangeMode: boolean;
  onNumberPress: (number: string) => void;
  onRangePress: () => void;
}

export default function NumericKeyboard({ 
  isRangeMode, 
  onNumberPress, 
  onRangePress 
}: NumericKeyboardProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    
    <View style={styles.container}>
      <View style={styles.grid}>
        {numbers.map((number) => (
          <TouchableOpacity
            key={number}
            style={styles.button}
            onPress={() => onNumberPress(number)}
          >
            <Text style={styles.buttonText}>{number}</Text>
          </TouchableOpacity>
        ))}
         <TouchableOpacity
        style={[styles.button]}
        onPress={onRangePress}
      >
        <ArrowUpDown size={24} color="#000" />
        <Text style={styles.buttonText}>
          {isRangeMode ? 'Fin de Rango' : 'Rango'}
        </Text>
      </TouchableOpacity>
      </View>
      
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rangeButton: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    
    height: 60,
  },
});