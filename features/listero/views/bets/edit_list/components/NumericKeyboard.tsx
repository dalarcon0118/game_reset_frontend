import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text,Button, useTheme } from '@ui-kitten/components';
import { ArrowUpDown } from 'lucide-react-native';
import { GameTypeCodes,AnnotationType } from '@/constants/Bet';
import NumberDisplay from './NumberDisplay';
import { formatNumbers } from '../utils/numbers';

interface NumericKeyboardProps {
  onNumberPress: (number: string) => void;
  gameType:GameTypeCodes;
  annotationType:AnnotationType;
}

export default function NumericKeyboard({ 
  onNumberPress, 
  annotationType,
  gameType
}: NumericKeyboardProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',"Limpiar","OK"];
  const theme = useTheme();
  const [numbersDisplay,setNumbersDisplay] = useState<string >("");
  const [numbersClick,setNumbersClick] = useState<string >("");
  const [numbersBuff,setNumbersBuff] = useState<string >("");
  useEffect(() => {
    console.log(`NumericKeyboard is now visible and active. ${gameType},${annotationType}`);
    // Aquí puedes añadir lógica adicional si es necesario,
    // como enfocar el primer botón para accesibilidad si usas refs,
    // o realizar alguna animación.
  }, [numbersDisplay]); 
  
  return (
    <View>
       <NumberDisplay
            numbers={formatNumbers(gameType,annotationType, numbersBuff)}
            annotationType={annotationType}
            gameTypeCode={gameType}
          />
      <View style={styles.container}>
        <View style={styles.grid}>
          {numbers.map((number) => (
          <Button
          key={number}
          appearance='ghost'
          size='large'
          status='primary'
          style={{
            ...styles.button
            ,backgroundColor: theme['color-primary-100'],
            borderColor: theme['color-primary-500']}}
          onPress={() =>{
            
            if(number === "OK"){
              console.log('OK -->',numbersBuff);
              onNumberPress(numbersBuff)
              setNumbersDisplay("");
              setNumbersClick("");
            }
            else if(number === "Limpiar"){
              setNumbersDisplay("");
              setNumbersClick("");
              setNumbersBuff("");
            }
            else{
              setNumbersBuff((prev)=> prev + number)
              setNumbersClick(number)
              setNumbersDisplay(number)
            }
          
          
          } }
        >
          <Text style={styles.buttonText}>{number}</Text>
        </Button>
          
          ))}
        
        </View>
      
     
      </View>    
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rangeButton: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    
    height: 60,
  },
});