import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Plus, DollarSign, ArrowDown } from 'lucide-react-native';

interface BetColumnProps {
  title: string;
  type: string;
  onCirclePress: (circleIndex: number) => void;
  currentNumber: string;
  currentAmount: string;
  betNumbers: string[];
  betAmounts: Record<string, string>;
}

export default function BetColumn({ 
  title, 
  type, 
  onCirclePress,
  currentNumber,
  currentAmount,
  betNumbers,
  betAmounts
}: BetColumnProps) {
  return (
    <View style={styles.column}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView style={styles.scrollView}>
        <View style={styles.circlesContainer}>
          <TouchableOpacity 
            style={[styles.circle, styles.dashedCircle]}
            onPress={() => onCirclePress(0)}
          >
            {currentNumber ? (
              <Text style={styles.numberText}>{currentNumber}</Text>
            ) : (
              <Plus size={24} color="#000" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.circle}
            onPress={() => onCirclePress(1)}
          >
            {currentAmount && onCirclePress === 1 ? (
              <Text style={styles.numberText}>{currentAmount}</Text>
            ) : (
              <DollarSign size={24} color="#000" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.circle}
            onPress={() => onCirclePress(2)}
          >
            {currentAmount && onCirclePress === 2 ? (
              <Text style={styles.numberText}>{currentAmount}</Text>
            ) : (
              <DollarSign size={24} color="#000" />
            )}
          </TouchableOpacity>
        </View>

        {/* Mostrar números de apuesta */}
        {betNumbers.length > 0 && (
          <View style={styles.betNumbersContainer}>
            {betNumbers.map((number, index) => (
              <View key={`${number}-${index}`} style={styles.betNumberItem}>
                <View style={styles.circle}>
                  <Text style={styles.numberText}>{number}</Text>
                </View>
                
                {betAmounts[number] && (
                  <>
                    <ArrowDown size={16} color="#000" />
                    <View style={styles.circle}>
                      <Text style={styles.numberText}>{betAmounts[number]}</Text>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    height: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scrollView: {
    width: '100%',
    maxHeight: 500,
  },
  circlesContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedCircle: {
    borderStyle: 'dashed',
  },
  numberText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  betNumbersContainer: {
    alignItems: 'center',
    width: '100%',
  },
  betNumberItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
});