import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, useTheme } from '@ui-kitten/components';

interface QuickAmountButtonsProps {
  amounts: number[];
  onSelectAmount: (amount: number) => void;
}

export default function QuickAmountButtons({
  amounts,
  onSelectAmount,
}: QuickAmountButtonsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        {amounts.slice(0, 3).map((amount) => (
          <Button
            key={`amount-${amount}`}
            appearance="outline"
            size="small"
            style={styles.amountButton}
            onPress={() => onSelectAmount(amount)}
          >
            ${amount}
          </Button>
        ))}
      </View>
      <View style={styles.buttonsRow}>
        {amounts.slice(3).map((amount) => (
          <Button
            key={`amount-${amount}`}
            appearance="outline"
            size="small"
            style={styles.amountButton}
            onPress={() => onSelectAmount(amount)}
          >
            ${amount}
          </Button>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});