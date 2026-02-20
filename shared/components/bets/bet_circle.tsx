import React from 'react';
import { StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import StyledText from '@/components/typography/styled_text';
import Colors from '@/constants/colors';

interface BetCircleProps {
  value: number | string;
  onPress?: () => void;
}

const BASE_SIZE = 40;

const getSizeForValue = (value: number | string): number => {
  const length = String(value).length;
  if (length <= 2) return BASE_SIZE;
  if (length === 3) return BASE_SIZE + 8;
  if (length >= 10) return BASE_SIZE + 60; // Aumentado para dar más espacio
  return BASE_SIZE + 16; // 4+ digits
};

const getFontSize = (value: number | string): number => {
  const length = String(value).length;
  if (length <= 2) return 16;
  if (length === 3) return 14;
  if (length >= 10) return 14; // Aumentado de 10 a 14 para mejor legibilidad
  return 12; // 4+ digits
};

export default function BetCircle({ value, onPress }: BetCircleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const size = getSizeForValue(value);
  const isFormattedLoteria = String(value).length >= 10;
  
  return (
    <TouchableOpacity 
      style={[
        value === "+" ? styles.circle : styles.circleWithValue,
        { 
          borderColor: Colors[colorScheme].primary,
          width: size,
          height: size,
          borderRadius: size / 2,
        }
      ]}
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <StyledText 
        variant="caption" 
        style={{ 
          fontSize: getFontSize(value),
          fontWeight: isFormattedLoteria ? 'bold' : 'normal' 
        }}
      >
        {value}
      </StyledText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  circleWithValue: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
