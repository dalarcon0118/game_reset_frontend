import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import BetColumn from './components/BetColumn';
import NumericKeyboard from './components/NumericKeyboard';
import RangeTypeDialog from './components/RangeTypeDialog';
import { GameTypes } from '@/constants/Bet';
import { generateContinuousRange, generateTerminalRange } from './utils/rangeUtils';

export default function BetEditScreen() {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeType, setRangeType] = useState<'continuous' | 'terminal' | null>(null);
  const [currentNumber, setCurrentNumber] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [rangeStartNumber, setRangeStartNumber] = useState('');
  const [showRangeDialog, setShowRangeDialog] = useState(false);
  const [betNumbers, setBetNumbers] = useState<string[]>([]);
  const [betAmounts, setBetAmounts] = useState<Record<string, string>>({});
  const [isAmountRangeMode, setIsAmountRangeMode] = useState(false);
  const [rangeAmount, setRangeAmount] = useState('');

  const handleNumberPress = (number: string) => {
    if (selectedCircle === 0) {
      // Si estamos en el primer círculo (número)
      if (currentNumber.length < 2) {
        const newNumber = currentNumber + number;
        setCurrentNumber(newNumber);
      }
    } else {
      // Si estamos en los círculos de monto
      setCurrentAmount(prev => prev + number);
    }
  };

  const handleRangePress = () => {
    if (!isRangeMode) {
      // Iniciar modo rango
      if (selectedCircle === 0 && currentNumber.length === 2) {
        // Si estamos en el círculo de número y ya tenemos 2 dígitos
        setRangeStartNumber(currentNumber);
        setShowRangeDialog(true);
      } else if (selectedCircle !== 0 && currentAmount.length > 0) {
        // Si estamos en el círculo de monto
        setIsAmountRangeMode(true);
        setRangeAmount(currentAmount);
        setIsRangeMode(true);
      }
    } else {
      // Finalizar modo rango
      if (rangeType && currentNumber.length === 2) {
        // Generar números según el tipo de rango
        let rangeNumbers: string[] = [];
        
        if (rangeType === 'continuous') {
          rangeNumbers = generateContinuousRange(rangeStartNumber, currentNumber);
        } else if (rangeType === 'terminal') {
          rangeNumbers = generateTerminalRange(rangeStartNumber, currentNumber);
        }
        
        // Agregar los números generados a la lista de apuestas
        setBetNumbers(prev => [...prev, ...rangeNumbers]);
        
        // Si estamos en modo rango de monto, asignar el mismo monto a todos los números
        if (isAmountRangeMode) {
          const newBetAmounts = { ...betAmounts };
          rangeNumbers.forEach(num => {
            newBetAmounts[num] = rangeAmount;
          });
          setBetAmounts(newBetAmounts);
        }
      }
      
      // Resetear estados
      setIsRangeMode(false);
      setRangeType(null);
      setCurrentNumber('');
      setIsAmountRangeMode(false);
    }
  };

  const handleRangeTypeSelect = (type: 'continuous' | 'terminal') => {
    setRangeType(type);
    setShowRangeDialog(false);
    setIsRangeMode(true);
    setCurrentNumber(''); // Limpiar para ingresar el número final
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.columnsContainer}>
        <BetColumn
          title="Fijos y Corridos"
          type={GameTypes.FIJO}
          onCirclePress={(circle) => {
            setSelectedColumn(GameTypes.FIJO);
            setSelectedCircle(circle);
          }}
          currentNumber={currentNumber}
          currentAmount={currentAmount}
          betNumbers={betNumbers}
          betAmounts={betAmounts}
        />
        <BetColumn
          title="Parlet"
          type={GameTypes.PARLET}
          onCirclePress={(circle) => {
            setSelectedColumn(GameTypes.PARLET);
            setSelectedCircle(circle);
          }}
          currentNumber={currentNumber}
          currentAmount={currentAmount}
          betNumbers={[]}
          betAmounts={{}}
        />
        <BetColumn
          title="Centena"
          type={GameTypes.CENTENA}
          onCirclePress={(circle) => {
            setSelectedColumn(GameTypes.CENTENA);
            setSelectedCircle(circle);
          }}
          currentNumber={currentNumber}
          currentAmount={currentAmount}
          betNumbers={[]}
          betAmounts={{}}
        />
      </View>
      
      {selectedColumn && (
        <NumericKeyboard
          isRangeMode={isRangeMode}
          onNumberPress={handleNumberPress}
          onRangePress={handleRangePress}
        />
      )}

      <RangeTypeDialog
        visible={showRangeDialog}
        onSelect={handleRangeTypeSelect}
        onCancel={() => setShowRangeDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
});