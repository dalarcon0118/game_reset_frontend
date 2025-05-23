import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { DrawService } from '@/shared/services/Draw';
import DrawItem from './DrawItem';
import SummaryCard from './SummaryCard';
import { FinancialSummaryService } from '@/shared/services/FinancialSummary';
import { router } from 'expo-router';
import { FinancialSummary } from '@/types';
import Header from './Header';
import {Text} from "@ui-kitten/components"
import QuickActions from './QuickActions';

export default function Dashboard() {
  const [lisDraws, draws,isLoading, errorDraws] = useDataFetch(DrawService.list);
  const [getFinancial,summary,isLoadingFinancial]  = useDataFetch<FinancialSummary,any>(FinancialSummaryService.get);

  useEffect(() => {
    getFinancial();
    lisDraws()
  }, []);

  const handleRulesPress = (drawId: string) => {
    router.push({ pathname: '/lister/bets_rules/[id]', params: { id: drawId } });
  };

  if (isLoading) {
    return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>);
  }

  if (errorDraws) {
    router.push('/error');
  }

  return (
    <ScrollView style={styles.container}>
      <Header/>
      {/* Financial Summary Cards */}
      <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>
          Resumen de hoy
        </Text>
        {summary && (
          <>
            <SummaryCard
              title="Recaudado"
              amount={summary.totalCollected}
              type="collected"
            />
            <SummaryCard
              title="Pagado"
              amount={summary.premiumsPaid}
              type="paid"
            />
            <SummaryCard
              title="Mis ganos"
              amount={summary.netResult}
              type="net"
            />
          </>
        )}
      </View>

      {/* Draws List */}
      <View style={styles.drawsContainer}>
        {draws?.map((draw, index) => (
          <DrawItem
            key={draw.id}
            draw={draw}
            onPress={handleRulesPress}
            index={index}
          />
        ))}
      </View>
      <QuickActions/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    width: '100%',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  drawsContainer: {
    padding: 8,
  },
});