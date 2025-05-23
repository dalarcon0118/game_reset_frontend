import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import StyledText from '@/components/typography/StyledText';
import Colors from '@/constants/Colors';

interface AmountCircleProps {
  amount: number | string;
}

const CIRCLE_SIZE = 40;

export default function AmountCircle({ amount }: AmountCircleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={[styles.circle, { borderColor: Colors[colorScheme].primary }]}>
      <StyledText variant="caption" color={Colors[colorScheme].primary}>
        {amount}
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
});