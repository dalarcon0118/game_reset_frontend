import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import StyledText from '@/components/typography/StyledText';
import Layout from '@/constants/Layout';
import AmountCircle from './AmountCircle';
import BetCircle from './BetCircle';
import { FijosCorridosBet } from '@/types';
import NumericKeyboard from './NumericKeyboard';
import { useFijosParlet } from './hooks/useFijos';
import BottomDrawer from '@/components/ui/BottomDrawer';
import { AnnotationTypes, GameTypes } from '@/constants/Bet';
import NumberDisplay from './NumberDisplay';

interface FijoCorridoBet {
  id: string;
  bet: number;
  fijoAmount: number | 'X';
  corridoAmount: number | 'X';
}

interface FijosCorridosColumnProps {
  onSelectPlay: any;
}

export default function FijosCorridosColumn({
  onSelectPlay
}:FijosCorridosColumnProps) {
  const {
    fijosCorridosList,
    showBetKeyboard, // Updated state name
    showAmountKeyboard, // Updated state name
    hideBetKeyboard, // Updated handler name
    hideAmountKeyboard, // Updated handler name
    handleBetKeyboardInput, // Updated handler name
    handleAmountKeyboardInput, // New handler
    handleAddBetPress,
    handleAmountCirclePress,
  } = useFijosParlet({onSelectPlay});

 

  
  const renderKeyboard = () => {
    const isVisible = showBetKeyboard || showAmountKeyboard;
    const onClose = showBetKeyboard ? hideBetKeyboard : hideAmountKeyboard;
    const onNumberPress = showBetKeyboard ? handleBetKeyboardInput : handleAmountKeyboardInput;
    const annotationType = showBetKeyboard ? AnnotationTypes.Bet : AnnotationTypes.Amount;
    // Add a "Done" button or similar mechanism to the amount keyboard if needed
    // to trigger finalizeAmountInput explicitly. For now, it triggers on close.

    return (
      <BottomDrawer isVisible={isVisible} onClose={onClose} title='' height={"50%"}>
       
        <NumericKeyboard
          onNumberPress={(number:string)=>{
            onNumberPress(number); 

          }} // Pass the correct handler
          annotationType={annotationType}
          gameType={GameTypes.FIJOS_CORRIDOS} // Assuming this column is always for this type
        />
        {/* Optionally add a "Done" button here for the amount keyboard */}
      </BottomDrawer>
    );
  };

  return (
    <View style={[styles.column, styles.colFijos]}>
      <View style={styles.columnContent}>
        
        {fijosCorridosList.map((item:FijosCorridosBet) => (
          <View key={item.id} style={styles.fijoRow}>
            <BetCircle value={item.bet.toString().padStart(2, '0')}/>
            
           {/* Fijo Amount Circle - Clickable */}
           <AmountCircle
              amount={item.fijoAmount} // Show '$' if null
              onPress={() => handleAmountCirclePress(item.id, 'fijo')} // Pass betId and type
            />
            {/* Corrido Amount Circle - Clickable */}
            <AmountCircle
              amount={item.corridoAmount} // Show '$' if null
              onPress={() => handleAmountCirclePress(item.id, 'corrido')} // Pass betId and type
            />
          </View>
          
        ))}
        <View key={`add-row-${Math.random().toString(36).substr(2, 9)}`} style={styles.fijoRow}>
            <BetCircle value={"+"} onPress={handleAddBetPress}/>
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