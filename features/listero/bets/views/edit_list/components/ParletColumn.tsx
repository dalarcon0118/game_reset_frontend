import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Layout from '../../../../../../constants/Layout';
import Colors from '../../../../../../constants/Colors';
import AmountCircle from './AmountCircle';
import BetCircle from './BetCircle';
import { FijosCorridosBet } from '../../../../../../types';
import BottomDrawer from '../../../../../../components/ui/BottomDrawer';
import NumericKeyboard from './NumericKeyboard';
import { AnnotationType, AnnotationTypes, GameTypes } from '../../../../../../constants/Bet';
import { useBets } from '../../../hooks/useBets';

interface ParletColumnProps {
  fijosCorridosList: FijosCorridosBet[];
}

export default function ParletColumn({
  fijosCorridosList
}: ParletColumnProps) {
  const {
    parlets: parletList,
    showParletKeyboard: isParletDrawerVisible,
    showAmountKeyboard: isAmmountDrawerVisible,
    activeParletBetId,
    editingAmountType,
    fromFijosyCorridoBet,
    potentialParletNumbers,
    processBetInput,
    submitAmountInput: processAmountInput,
    closeBetKeyboard: showParletDrawer,
    closeAmountKeyboard: showAmmountDrawer,
    editParletBet,
    openParletAmountKeyboard: editAmmountKeyboard,
    pressAddParlet,
    confirmParletBet,
    cancelParletBet
  } = useBets();

  const [value, setValue] = useState("");

  useEffect(() => {
    if (activeParletBetId && parletList.length > 0) {
      const parlet = parletList.find((bet) => bet.id === activeParletBetId);
      if (parlet) {
        if (!isAmmountDrawerVisible) {
          setValue(parlet.bets.map(b => b.toString().padStart(2, '0')).join(""));
        } else {
          setValue(parlet.amount?.toString() || "");
        }
      }
    } else {
      setValue("");
    }
  }, [activeParletBetId, parletList, isAmmountDrawerVisible]);

  useEffect(() => {
    if (fromFijosyCorridoBet) {
      Alert.alert(
        "Desea Agregar estos numeros como parlet?",
        `Lista de numeros [${potentialParletNumbers.join(', ')}] como parlet?`,
        [
          { text: "Cancel", onPress: cancelParletBet, style: "cancel" },
          { text: "OK", onPress: confirmParletBet }
        ]
      );
    }
  }, [fromFijosyCorridoBet, potentialParletNumbers, cancelParletBet, confirmParletBet]);

  const renderKeyboard = (annotationType: AnnotationType) => {
    const isVisible = annotationType === AnnotationTypes.Amount ? isAmmountDrawerVisible && editingAmountType === 'parlet' : isParletDrawerVisible;
    const onClose = annotationType === AnnotationTypes.Amount ? () => showAmmountDrawer() : () => showParletDrawer();
    const onNumberPress = (number: string) => (annotationType === AnnotationTypes.Amount) ? processAmountInput(number) : processBetInput(number);

    return (
      <BottomDrawer isVisible={isVisible} onClose={onClose} height={"55%"} title=''>
        <NumericKeyboard
          onNumberPress={onNumberPress}
          annotationType={annotationType}
          gameType={GameTypes.PARLET}
          value={value}
        />
      </BottomDrawer>
    );
  };

  return (
    <View style={[styles.column, styles.colParlet]}>
      <View style={styles.columnContent}>
        {parletList.map((item) => (
          <View key={item.id} style={styles.parletBlock}>
            <View style={styles.parletNumbers}>
              {item.bets.map((bet, index) => (
                <BetCircle key={index} value={bet.toString().padStart(2, '0')} onPress={() => editParletBet(item.id)} />
              ))}
            </View>
            <AmountCircle amount={item.amount} onPress={() => editAmmountKeyboard(item.id)} />
          </View>
        ))}
      </View>

      <View style={styles.columnContent}>
        <View style={styles.parletBlock}>
          <View style={styles.parletNumbers}>
            <BetCircle value={"+"} onPress={() => pressAddParlet(fijosCorridosList)} />
          </View>
          <AmountCircle amount={"$"} />
        </View>
      </View>
      {renderKeyboard(AnnotationTypes.Bet)}
      {renderKeyboard(AnnotationTypes.Amount)}
    </View>
  );
}
/*{item.bets.map((bet, index) => (
                 <BetCircle key={index} value= {"+"} onPress={()=>{}}/>
                
              ))}*/

const styles = StyleSheet.create({
  column: {
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
    flex: 1,
  },
  colParlet: {
    flex: 2,
    paddingHorizontal: Layout.spacing.xs,
  },
  columnContent: {
    paddingVertical: Layout.spacing.xs,
  },
  parletBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
    minHeight: 60,
  },
  parletNumbers: {
    flex: 1,
    marginRight: Layout.spacing.xs,
  },
  parletBetText: {
    marginBottom: Layout.spacing.xxs,
  },
});