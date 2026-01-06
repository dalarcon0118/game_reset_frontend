import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BetColumn from './components/BetColumn';
import NumericKeyboard from './components/NumericKeyboard';
import RangeTypeDialog from './components/RangeTypeDialog';
import { GameTypes } from '../../../constants/Bet';
import { useBets } from '../bets/hooks/useBets';

export default function BetEditScreen() {
  const {
    fijosCorridos,
    parlets,
    centenas,
    editSession,
    setEditSelectedColumn,
    setEditSelectedCircle,
    toggleRangeMode,
    setRangeType,
    generateRangeBets,
    updateEditInput
  } = useBets();

  const {
    selectedColumn,
    selectedCircle,
    isRangeMode,
    rangeType,
    currentNumber,
    currentAmount,
    rangeStartNumber,
    showRangeDialog
  } = editSession;

  const handleNumberPress = (number: string) => {
    updateEditInput(number);
  };

  const handleRangePress = () => {
    if (!isRangeMode) {
      if (selectedCircle === 0 && currentNumber.length === 2) {
        // Iniciar diálogo de rango
        toggleRangeMode(true);
      }
    } else {
      if (rangeType && currentNumber.length === 2) {
        generateRangeBets(rangeStartNumber, currentNumber);
      }
      toggleRangeMode(false);
    }
  };

  const handleRangeTypeSelect = (type: 'continuous' | 'terminal') => {
    setRangeType(type);
  };

  // Derivar datos para las columnas
  const fijosNumbers = fijosCorridos.map(b => b.bet.toString());
  const fijosAmounts = fijosCorridos.reduce((acc, b) => {
    if (b.fijoAmount) acc[b.bet.toString()] = b.fijoAmount.toString();
    return acc;
  }, {} as Record<string, string>);

  const parletNumbers = parlets.map(p => p.bets.join('-'));
  const parletAmounts = parlets.reduce((acc, p) => {
    if (p.amount) acc[p.bets.join('-')] = p.amount.toString();
    return acc;
  }, {} as Record<string, string>);

  const centenaNumbers = centenas.map(c => c.bet.toString());
  const centenaAmounts = centenas.reduce((acc, c) => {
    if (c.amount) acc[c.bet.toString()] = c.amount.toString();
    return acc;
  }, {} as Record<string, string>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.columnsContainer}>
        <BetColumn
          title="Fijos y Corridos"
          type={GameTypes.FIJO}
          onCirclePress={(circle) => {
            setEditSelectedColumn(GameTypes.FIJO);
            setEditSelectedCircle(circle);
          }}
          currentNumber={selectedColumn === GameTypes.FIJO && selectedCircle === 0 ? currentNumber : ''}
          currentAmount={selectedColumn === GameTypes.FIJO && selectedCircle !== 0 ? currentAmount : ''}
          betNumbers={fijosNumbers}
          betAmounts={fijosAmounts}
        />
        <BetColumn
          title="Parlet"
          type={GameTypes.PARLET}
          onCirclePress={(circle) => {
            setEditSelectedColumn(GameTypes.PARLET);
            setEditSelectedCircle(circle);
          }}
          currentNumber={selectedColumn === GameTypes.PARLET && selectedCircle === 0 ? currentNumber : ''}
          currentAmount={selectedColumn === GameTypes.PARLET && selectedCircle !== 0 ? currentAmount : ''}
          betNumbers={parletNumbers}
          betAmounts={parletAmounts}
        />
        <BetColumn
          title="Centena"
          type={GameTypes.CENTENA}
          onCirclePress={(circle) => {
            setEditSelectedColumn(GameTypes.CENTENA);
            setEditSelectedCircle(circle);
          }}
          currentNumber={selectedColumn === GameTypes.CENTENA && selectedCircle === 0 ? currentNumber : ''}
          currentAmount={selectedColumn === GameTypes.CENTENA && selectedCircle !== 0 ? currentAmount : ''}
          betNumbers={centenaNumbers}
          betAmounts={centenaAmounts}
        />
      </View>

      <RangeTypeDialog
        visible={showRangeDialog}
        onSelect={handleRangeTypeSelect}
        onCancel={() => toggleRangeMode(false)}
      />

      {selectedColumn && (
        <NumericKeyboard
          onNumberPress={handleNumberPress}
          onRangePress={handleRangePress}
          isRangeMode={isRangeMode}
        />
      )}
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
    flex: 1,
  },
});