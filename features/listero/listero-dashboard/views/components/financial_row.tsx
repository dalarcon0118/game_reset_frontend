import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/shared/utils/formatters';

interface FinancialRowProps {
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
  showBalance: boolean;
}

export const FinancialRow: React.FC<FinancialRowProps> = ({
  totalCollected,
  premiumsPaid,
  netResult,
  showBalance,
}) => {
  const formatValue = (val: number) => showBalance ? formatCurrency(val) : '****';

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.label}>Recaudado</Text>
        <Text style={styles.value}>{formatValue(totalCollected)}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>Premios</Text>
        <Text style={[styles.value, styles.negative]}>{formatValue(premiumsPaid)}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>Neto</Text>
        <Text style={styles.value}>{formatValue(netResult)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F5FF',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
	label: {
		fontSize: 12,
		color: '#8F9BB3',
		marginBottom: 4,
	},
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2138',
  },
  negative: {
    color: '#FF3D71',
  },
});