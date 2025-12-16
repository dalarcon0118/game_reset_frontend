import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import AmountCircle from './AmountCircle';
import BetCircle from './BetCircle';
import { FijosCorridosBet } from '@/types';
import { useParlet } from './hooks/useParlet';
import BottomDrawer from '@/components/ui/BottomDrawer';
import NumericKeyboard from './NumericKeyboard';
import { AnnotationType, AnnotationTypes, GameTypes } from '@/constants/Bet';

interface ParletBet {
  id: string;
  bets: number[];
  amount?: number | string | null;
}

interface ParletColumnProps {
  fijosCorridosList: FijosCorridosBet[];
  betTypeId: string | null;
}

export default function ParletColumn({
  fijosCorridosList,
  betTypeId
}: ParletColumnProps) {
  const {
    pressAddParlet,
    isParletDrawerVisible,
    isAmmountDrawerVisible,
    processAmountInput,
    processBetInput,
    showParletDrawer,
    showAmmountDrawer,
    parletList,
    editAmmountKeyboard,
    editParletBet,
    activeParletBetId,
    value
  } = useParlet();

  useEffect(() => {
    console.log("is visible", isParletDrawerVisible);
    console.log(parletList);
    //(newParletBet) ? setParletList([newParletBet]):null;
  }, [parletList])




  const renderKeyboard = (annotationType: AnnotationType) => {
    const isVisible = annotationType === AnnotationTypes.Amount ? isAmmountDrawerVisible : isParletDrawerVisible;
    const show = annotationType === AnnotationTypes.Amount ? showAmmountDrawer : showParletDrawer;
    const onNumberPress = (number: string) => (annotationType === AnnotationTypes.Amount) ? processAmountInput(number) : processBetInput(number);
    // add here the implementation to:
    // 1. Get the active parlet bet id
    // 2. Find the parlet bet with the active id in the parlet list
    // 3. Set the numbers display to the value of the found parlet bet
    // 4.Join the bets array with "-" to form the display value


    return (
      <BottomDrawer isVisible={isVisible} onClose={() => show(false)} height={"55%"}>

        <NumericKeyboard
          onNumberPress={onNumberPress} // Pass the correct handler
          annotationType={annotationType}
          gameType={GameTypes.PARLET} // Assuming this column is always for this type
          value={value}
        />
        {/* Optionally add a "Done" button here for the amount keyboard */}
      </BottomDrawer>
    );
  };


  return (
    <View style={[styles.column, styles.colParlet]}>
      <View style={styles.columnContent}>
        {parletList.map((item) => (
          <View key={item.id} style={styles.parletBlock}>
            <View style={styles.parletNumbers}>
              {item.bets.map((bet, index) => {
                return (
                  <BetCircle key={index} value={bet} onPress={() => editParletBet(item.id)} />
                )
              })}
            </View>

            <AmountCircle amount={item.amount} onPress={() => editAmmountKeyboard(item.id)} />
          </View>
        ))}
      </View>


      <View style={styles.columnContent}>
        <View key={`add-row-${Math.random().toString(36).substr(2, 9)}`} style={styles.parletBlock}>
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