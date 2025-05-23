import { View, StyleSheet } from 'react-native';
import SummaryCard from './SummaryCard';
import StyledText from '../../../../components/typography/StyledText';
import Layout from '@/constants/Layout';
import { FinancialSummary } from '@/types';

interface SummarySectionProps {
  data: FinancialSummary;
}

export default function SummarySection({ data }: SummarySectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StyledText variant="subheading" weight="bold">
          Resumen Rápido (Hoy)
        </StyledText>
      </View>
      <View style={styles.cardsContainer}>
        <SummaryCard
          title="Total Recaudado"
          amount={data.totalCollected}
          type="collected"
          index={0}
        />
         <SummaryCard
          title="Mi ganancia"
          amount={data.netResult}
          type="net"
          index={2}
        />
        <SummaryCard
          title="Premios a Pagar"
          amount={data.premiumsPaid}
          type="paid"
          index={1}
        />
       
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  header: {
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: Layout.spacing.xs,
  },
});