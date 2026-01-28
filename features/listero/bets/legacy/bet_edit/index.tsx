import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BetColumn from './components/bet_column';
import NumericKeyboard from './components/numeric_keyboard';
import RangeTypeDialog from './components/range_type_dialog';
import { GameTypes } from '../../../constants/bet';
import { useBetsStore, selectBetsModel, selectDispatch } from '../bets/store';
import { EditMsgType } from '../bets/store/bet-edit/edit.types';
import { FijosCorridosBet, ParletBet, CentenaBet } from '@/types';

export default function BetEditScreen() {
  const model = useBetsStore(selectBetsModel);
  const dispatch = useBetsStore(selectDispatch);

  const {
    listSession,
    editSession
  } = model;

  const {
    fijosCorridos,
    parlets,
    centenas
  } = listSession;

  const {
    selectedColumn,
    selectedCircle,
    isRangeMode,
    rangeType,
    currentNumber,
    currentAmount,
    rangeStartNumber,
  } = editSession;

  const handleNumberPress = (value: string) => {
    dispatch({ type: 'EDIT', payload: { type: EditMsgType.UPDATE_EDIT_INPUT, value } });
  };

  const handleRangePress = () => {
    if (!isRangeMode) {
      if (selectedCircle === 0 && currentNumber.length === 2) {
        // Iniciar diálogo de rango
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.TOGGLE_RANGE_MODE, enabled: true } });
      }
    } else {
      if (rangeType && currentNumber.length === 2) {
        dispatch({ type: 'EDIT', payload: { type: EditMsgType.GENERATE_RANGE_BETS, start: rangeStartNumber, end: currentNumber } });
      }
      dispatch({ type: 'EDIT', payload: { type: EditMsgType.TOGGLE_RANGE_MODE, enabled: false } });
    }
  };

  const handleRangeTypeSelect = (rangeType: 'continuous' | 'terminal' | null) => {
    dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_RANGE_TYPE, rangeType } });
  };

  // Derivar datos para las columnas
  const fijosNumbers = fijosCorridos.map((b: FijosCorridosBet) => b.bet.toString());
  const fijosAmounts = fijosCorridos.reduce((acc: Record<string, string>, b: FijosCorridosBet) => {
    if (b.fijoAmount) acc[b.bet.toString()] = b.fijoAmount.toString();
    return acc;
  }, {} as Record<string, string>);

  const parletNumbers = parlets.map((p: ParletBet) => p.bets.join('-'));
  const parletAmounts = parlets.reduce((acc: Record<string, string>, p: ParletBet) => {
    if (p.amount) acc[p.bets.join('-')] = p.amount.toString();
    return acc;
  }, {} as Record<string, string>);

  const centenaNumbers = centenas.map((c: CentenaBet) => c.bet.toString());
  const centenaAmounts = centenas.reduce((acc: Record<string, string>, c: CentenaBet) => {
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
            dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_COLUMN, column: GameTypes.FIJO } });
            dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_CIRCLE, circle } });
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
            dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_COLUMN, column: GameTypes.PARLET } });
            dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_CIRCLE, circle } });
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
            dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_COLUMN, column: GameTypes.CENTENA } });
            dispatch({ type: 'EDIT', payload: { type: EditMsgType.SET_EDIT_SELECTED_CIRCLE, circle } });
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