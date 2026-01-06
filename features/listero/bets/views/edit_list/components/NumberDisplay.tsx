import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { AnnotationType,AnnotationTypes,GameTypeCodes, GameTypes } from '@/constants/Bet';
import { formatNumbers } from '../utils/numbers';

interface NumberDisplayProps {
  numbers: string;
  gameTypeCode: GameTypeCodes;
  annotationType: AnnotationType
}




export default function NumberDisplay({
  numbers,
  gameTypeCode,
  annotationType
}: NumberDisplayProps) {
  const theme = useTheme();
  const [numberState, setNumberState] = React.useState<string>(numbers)
  
  React.useEffect(() => {

    console.log('NumbersDisplay',numbers);
    
  },[numbers])



  return (
    <View 
      style={[
        styles.container, 
        {
          backgroundColor: theme['background-basic-color-2'],
          borderColor: theme['border-basic-color-3'],
        }
      ]}
    >
      <Text category="h3" style={styles.numbers}>
        {numbers}
        
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 16,
  },
  numbers: {
    letterSpacing: 2,
  },
});