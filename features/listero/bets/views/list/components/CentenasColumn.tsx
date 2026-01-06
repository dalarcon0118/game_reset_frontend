import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/StyledText';
import Layout from '@/constants/Layout';
import AmountCircle from './AmountCircle';

interface CentenaBet {
  id: string;
  bet: number;
  amount: number;
}

interface CentenasColumnProps {
  bets: CentenaBet[];
}

export default function CentenasColumn({ bets }: CentenasColumnProps) {
  return (
    <View style={[styles.column, styles.colCentenas]}>
      <View style={styles.columnContent}>
        {bets.map((item) => (
          <View key={item.id} style={styles.centenaRow}>
            <StyledText style={styles.centenaBetText}>{item.bet}</StyledText>
            <AmountCircle amount={item.amount} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    borderRightWidth: 1,
    borderRightColor: '#E8E8E8',
    flex: 1,
  },
  colCentenas: {
    flex: 2,
    borderRightWidth: 0,
    paddingHorizontal: Layout.spacing.xs,
  },
  columnContent: {
    paddingVertical: Layout.spacing.xs,
  },
  centenaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
  },
  centenaBetText: {
    marginRight: Layout.spacing.sm,
  },
});