import React from 'react';
import { StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import StyledText from '@/components/typography/StyledText';
import Colors from '@/constants/Colors';

interface BetCircleProps {
  value: number | string;
  onPress?: () => void;
}

const BASE_SIZE = 40;

const getSizeForValue = (value: number | string): number => {
  const length = String(value).length;
  if (length <= 2) return BASE_SIZE;
  if (length === 3) return BASE_SIZE + 8;
  return BASE_SIZE + 16; // 4+ digits
};

const getFontSize = (value: number | string): number => {
  const length = String(value).length;
  if (length <= 2) return 16;
  if (length === 3) return 14;
  return 12; // 4+ digits
};

export default function BetCircle({ value, onPress }: BetCircleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const size = getSizeForValue(value);
  
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
      <StyledText variant="caption" style={{ fontSize: getFontSize(value) }}>
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
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
