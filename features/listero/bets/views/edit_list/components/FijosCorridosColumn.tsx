import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AmountCircle from './AmountCircle';
import BetCircle from './BetCircle';
import { FijosCorridosBet } from '../../../../../../types';
import NumericKeyboard from './NumericKeyboard';
import BottomDrawer from '../../../../../../components/ui/BottomDrawer';
import { AnnotationTypes, GameTypes } from '../../../../../../constants/Bet';
import Layout from '../../../../../../constants/Layout';
import { useBets } from '../../../hooks/useBets';

interface FijosCorridosColumnProps {}

export default function FijosCorridosColumn({}: FijosCorridosColumnProps) {
  const {
    fijosCorridos,
    showBetKeyboard,
    showAmountKeyboard,
    amountConfirmationDetails,
    openBetKeyboard,
    closeBetKeyboard,
    openAmountKeyboard,
    closeAmountKeyboard,
    processBetInput,
    submitAmountInput,
    confirmApplyAmountAll,
    confirmApplyAmountSingle,
    cancelAmountConfirmation
  } = useBets();

  // Handle amount confirmation alerts
  useEffect(() => {
    if (amountConfirmationDetails) {
      const { amountValue, intendedAmountType } = amountConfirmationDetails;
      Alert.alert(
        "Confirmar Monto",
        `Desea colocar ${amountValue} a todos los números anteriores en ${intendedAmountType === 'fijo' ? 'FIJO' : 'CORRIDO'}?`,
        [
          { text: "Cancelar", onPress: cancelAmountConfirmation, style: "cancel" },
          { text: "Sólo a éste", onPress: confirmApplyAmountSingle },
          { text: "Sí, a todos", onPress: confirmApplyAmountAll }
        ],
        { cancelable: false }
      );
    }
  }, [
    amountConfirmationDetails,
    cancelAmountConfirmation,
    confirmApplyAmountAll,
    confirmApplyAmountSingle
  ]);

  const renderKeyboard = () => {
    const isVisible = showBetKeyboard || showAmountKeyboard;
    const onClose = showBetKeyboard ? closeBetKeyboard : closeAmountKeyboard;
    const onNumberPress = showBetKeyboard ? processBetInput : submitAmountInput;
    const annotationType = showBetKeyboard ? AnnotationTypes.Bet : AnnotationTypes.Amount;

    return (
      <BottomDrawer isVisible={isVisible} onClose={onClose} title='' height={"50%"}>
        <NumericKeyboard
          onNumberPress={(number: string) => onNumberPress(number)}
          annotationType={annotationType}
          gameType={GameTypes.FIJOS_CORRIDOS}
        />
      </BottomDrawer>
    );
  };

  return (
    <View style={[styles.column, styles.colFijos]}>
      <View style={styles.columnContent}>
        {fijosCorridos.map((item: FijosCorridosBet) => (
          <View key={item.id} style={styles.fijoRow}>
            <BetCircle value={item.bet.toString().padStart(2, '0')} />
            <AmountCircle
              amount={item.fijoAmount}
              onPress={() => openAmountKeyboard(item.id, 'fijo')}
            />
            <AmountCircle
              amount={item.corridoAmount}
              onPress={() => openAmountKeyboard(item.id, 'corrido')}
            />
          </View>
        ))}
        <View style={styles.fijoRow}>
          <BetCircle value={"+"} onPress={openBetKeyboard} />
          <AmountCircle amount={"$"} />
          <AmountCircle amount={"$"} />
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