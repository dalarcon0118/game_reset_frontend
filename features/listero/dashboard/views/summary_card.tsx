import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Label } from '../../../../shared/components';
import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react-native';
import { useDashboardStore } from '../core/store';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'collected' | 'paid' | 'net';
  index?: number;
}

export default function SummaryCard({
  title,
  amount,
  type,
  index = 0,
}: SummaryCardProps) {
  const showBalance = useDashboardStore((state) => state.model.showBalance);

  const getTextColor = () => {
    switch (type) {
      case 'collected':
        return '#2E3A59';
      case 'paid':
        return '#FF3D71';
      case 'net':
        return amount >= 0 ? '#00C48C' : '#FF3D71';
    }
  };

  const displayAmount = showBalance 
    ? `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : '****';

  return (
    <View style={styles.card}>
      <Label
        type='detail'
        style={styles.title}
      >
        {title}
      </Label>
      <Label
        style={[styles.value, { color: getTextColor() }]}
      >
        {displayAmount}
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  title: {
    fontSize: 10,
    color: '#8F9BB3',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});