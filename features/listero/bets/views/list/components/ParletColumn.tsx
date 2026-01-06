import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/StyledText';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import AmountCircle from './AmountCircle';

interface ParletBet {
  id: string;
  bets: number[];
  amount: number;
}

interface ParletColumnProps {
  bets: ParletBet[];
}

export default function ParletColumn({ bets }: ParletColumnProps) {
  return (
    <View style={[styles.column, styles.colParlet]}>
      <View style={styles.columnContent}>
        {bets.map((item) => (
          <View key={item.id} style={styles.parletBlock}>
            <View style={styles.parletNumbers}>
              {item.bets.map((bet, index) => (
                <StyledText key={index} style={styles.parletBetText}>
                  {bet.toString().padStart(2, '0')}
                </StyledText>
              ))}
            </View>
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