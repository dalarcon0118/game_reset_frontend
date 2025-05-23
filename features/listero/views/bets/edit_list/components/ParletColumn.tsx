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
  fijosCorridosList:FijosCorridosBet[];
}

export default function ParletColumn({ fijosCorridosList }: ParletColumnProps) {
  const { 
    promptToAddAsParlet, 
    newParletBet,
    isParletDrawerVisible,
    isAmmountDrawerVisible,
    processAmountInput,
    processBetInput,
    showParletDrawer,
    showAmmountDrawer,
    parletList,
    showAmmountKeyboard,
    activateAnnotationType,
   } = useParlet();


  useEffect(() => {
    console.log("is visible", isParletDrawerVisible);
    console.log(parletList);
    //(newParletBet) ? setParletList([newParletBet]):null;
  },[parletList])


  const renderKeyboard = (annotationType: AnnotationType) => {
    const isVisible = annotationType === AnnotationTypes.Amount? isAmmountDrawerVisible :isParletDrawerVisible ;
    console.log("is visible", isVisible,annotationType);
    const show = annotationType === AnnotationTypes.Amount? showAmmountDrawer :showParletDrawer ;
    const onNumberPress = annotationType === AnnotationTypes.Amount? processAmountInput :processBetInput ;

    return (
      <BottomDrawer isVisible={isVisible} onClose={()=>show(false)} title='' height={"50%"}>
       
        <NumericKeyboard
          onNumberPress={(number:string)=>{
           onNumberPress(number); 

          }} // Pass the correct handler
          annotationType={annotationType}
          gameType={GameTypes.PARLET} // Assuming this column is always for this type
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
            <View  style={styles.parletNumbers}>
            {item.bets.map((bet, index) =>{
              return (
                <BetCircle  key={index} value= {bet} />
              )
            })}
            </View>
           
            <AmountCircle amount={item.amount}  onPress={()=>showAmmountKeyboard()} />
          </View>
        ))}
      </View>
      

      <View style={styles.columnContent}>
       
          <View key={`add-row-${Math.random().toString(36).substr(2, 9)}`}  style={styles.parletBlock}>
            <View style={styles.parletNumbers}>
              <BetCircle  value= {"+"} onPress={()=>{
                  promptToAddAsParlet(fijosCorridosList)
                }}/>
            </View>
            <AmountCircle amount={"$"} />
          </View>
      </View>
      {renderKeyboard(AnnotationTypes.Bet) }
      {renderKeyboard(AnnotationTypes.Amount)      }
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