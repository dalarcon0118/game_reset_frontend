import React from 'react';
import { View, StyleSheet } from 'react-native';
import AmountCircle from '../../../shared/components/amount_circle';
import BetCircle from '../../../shared/components/bet_circle';
import { FijosCorridosBet } from '@/types';
import bottom_drawer from '@/components/ui/bottom_drawer';
import Layout from '@/constants/layout';
import { useFijos } from '../use_fijos';
import { BetNumericKeyboard, AmountNumericKeyboard } from '../../../shared/components/numeric_keyboard';

interface FijosCorridosColumnProps {
    editable?: boolean;
}

export default function FijosCorridosColumn({ editable = false }: FijosCorridosColumnProps) {
    const {
        fijosCorridosList,
        showBetKeyboard,
        showAmountKeyboard,
        currentInput,
        handleAddBetPress,
        handleAmountCirclePress,
        hideBetKeyboard,
        hideAmountKeyboard,
        handleKeyPress,
        handleConfirmInput,
    } = useFijos();

    console.log('FijosCorridosColumn rendering body... list length:', fijosCorridosList?.length);


  const renderKeyboard = () => {
    const isVisible = showBetKeyboard || showAmountKeyboard;
    const onClose = showBetKeyboard ? hideBetKeyboard : hideAmountKeyboard;

    console.log('FijosCorridosColumn: Rendering Keyboard. showBetKeyboard:', showBetKeyboard, 'showAmountKeyboard:', showAmountKeyboard, 'isVisible:', isVisible);

    return (
      <bottom_drawer isVisible={isVisible} onClose={onClose} title='' height={"60%"}>
        {showBetKeyboard ? (
          <BetNumericKeyboard
            onKeyPress={handleKeyPress}
            onConfirm={handleConfirmInput}
            currentInput={currentInput}
          />
        ) : (
          <AmountNumericKeyboard
            onKeyPress={handleKeyPress}
            onConfirm={handleConfirmInput}
            currentInput={currentInput}
          />
        )}
      </bottom_drawer>
    );
  };
 const renderBets =() =>(
  fijosCorridosList.map((item: FijosCorridosBet) => (
          <View key={item.id} style={styles.fijoRow}>
            <BetCircle 
              value={item.bet.toString().padStart(2, '0')} 
            />
            <AmountCircle
              amount={item.fijoAmount}
              onPress={editable ? () => handleAmountCirclePress(item.id, 'fijo') : undefined}
            />
            <AmountCircle
              amount={item.corridoAmount}
              onPress={editable ? () => handleAmountCirclePress(item.id, 'corrido') : undefined}
            />
          </View>
        ))
      )

  return (
    <View style={[styles.column, styles.colFijos]}>
      <View style={styles.columnContent}>
        {renderBets()}
        {editable && (
          <View style={styles.fijoRow}>
            <BetCircle 
              value={"+"} 
              onPress={() => {
                console.log('BetCircle + pressed');
                handleAddBetPress?.();
              }} 
            />
            <AmountCircle amount={null} onPress={() => {}} />
            <AmountCircle amount={null} onPress={() => {}} />
          </View>
        )}
      </View>
      {editable && renderKeyboard()}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    paddingTop: 12
  },
  colFijos: {
    flex: 3,
    paddingHorizontal: Layout.spacing.xs,
  },
  columnContent: {
    paddingVertical: Layout.spacing.xs,
  },
  fijoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
  },
  fijoBetText: {
    width: 30,
    textAlign: 'right',
    marginRight: Layout.spacing.xs,
  },
});
