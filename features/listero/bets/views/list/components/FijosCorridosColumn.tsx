import React from 'react';
import { View, StyleSheet } from 'react-native';
import StyledText from '@/components/typography/StyledText';
import Layout from '@/constants/Layout';
import AmountCircle from './AmountCircle';
import BetCircle from './BetCircle';

interface FijoCorridoBet {
  id: string;
  bet: number;
  fijoAmount: number | 'X';
  corridoAmount: number | 'X';
}

interface FijosCorridosColumnProps {
  bets: FijoCorridoBet[];
}

export default function FijosCorridosColumn({ bets }: FijosCorridosColumnProps) {
  return (
    <View style={[styles.column, styles.colFijos]}>
      <View style={styles.columnContent}>
        {bets.map((item) => (
          <View key={item.id} style={styles.fijoRow}>
            <BetCircle value={item.bet.toString().padStart(2, '0')}/>
            
            <AmountCircle amount={item.fijoAmount} />
            <AmountCircle amount={item.corridoAmount} />
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