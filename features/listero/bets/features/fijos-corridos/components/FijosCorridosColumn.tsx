import React from 'react';
import { View, StyleSheet } from 'react-native';
import AmountCircle from '../../../shared/components/AmountCircle';
import BetCircle from '../../../shared/components/BetCircle';
import { FijosCorridosBet } from '@/types';
import BottomDrawer from '@/components/ui/BottomDrawer';
import { AnnotationTypes, GameTypes } from '@/constants/Bet';
import Layout from '@/constants/Layout';
import { useFijos } from '../useFijos';
import { CustomNumericKeyboard } from '../../../shared/components/NumericKeyboard';

interface FijosCorridosColumnProps {}

export default function FijosCorridosColumn({}: FijosCorridosColumnProps) {
  const {
    fijosCorridosList,
    showBetKeyboard,
    showAmountKeyboard,
    handleAddBetPress,
    handleAmountCirclePress,
    hideBetKeyboard,
    hideAmountKeyboard,
    processBetInput,
    handleAmountKeyboardInput,
  } = useFijos();

  const renderKeyboard = () => {
    const isVisible = showBetKeyboard || showAmountKeyboard;
    const onClose = showBetKeyboard ? hideBetKeyboard : hideAmountKeyboard;
    const onNumberPress = showBetKeyboard ? processBetInput : handleAmountKeyboardInput;
    const annotationType = showBetKeyboard ? AnnotationTypes.Bet : AnnotationTypes.Amount;

    return (
      <BottomDrawer isVisible={isVisible} onClose={onClose} title='' height={"50%"}>
        <CustomNumericKeyboard
          onNumberPress={(number: string) => onNumberPress(number)}
          annotationType={annotationType}
          gameType={GameTypes.FIJOS_CORRIDOS}
        />
      </BottomDrawer>
    );
  };
 const renderBets =() =>(
  fijosCorridosList.map((item: FijosCorridosBet) => (
          <View key={item.id} style={styles.fijoRow}>
            <BetCircle value={item.bet.toString().padStart(2, '0')} />
            <AmountCircle
              amount={item.fijoAmount}
              onPress={() => handleAmountCirclePress(item.id, 'fijo')}
            />
            <AmountCircle
              amount={item.corridoAmount}
              onPress={() => handleAmountCirclePress(item.id, 'corrido')}
            />
          </View>
        ))
      )

  return (
    <View style={[styles.column, styles.colFijos]}>
      <View style={styles.columnContent}>
        {renderBets()}
        <View style={styles.fijoRow}>
          <BetCircle value={"+"} onPress={handleAddBetPress} />
          <AmountCircle amount={null} onPress={() => {}} />
          <AmountCircle amount={null} onPress={() => {}} />
        </View>
      </View>
      {renderKeyboard()}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    borderRightWidth: 1,
    borderRightColor: '#E8E8E8',
    flex: 1,
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
