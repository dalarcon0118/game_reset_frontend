import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DrawFinancialTotals } from '../model';
import SummaryCard from './summary_card';

interface FinancialRowProps {
  totals: DrawFinancialTotals | undefined;
  premiumsPaid: number;
  showBalance: boolean;
}

const FinancialRow: React.FC<FinancialRowProps> = ({
  totals,
  premiumsPaid,
  showBalance,
}) => {
  const totalCollected = totals?.totalCollected ?? 0;
  const netResult = totals?.netResult ?? 0;

  return (
    <View style={styles.financialRow}>
      <SummaryCard
        title="Ventas"
        amount={totalCollected}
        type="collected"
        showBalance={showBalance}
        hasDiscrepancy={false}
      />
      <View style={styles.verticalDivider} />
      <SummaryCard
        title="Premios"
        amount={premiumsPaid}
        type="paid"
        showBalance={showBalance}
      />
      <View style={styles.verticalDivider} />
      <SummaryCard
        title="Ganancia"
        amount={netResult}
        type="net"
        showBalance={showBalance}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  financialRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E4E9F2',
    height: '60%',
    alignSelf: 'center',
  },
});

export default FinancialRow;
