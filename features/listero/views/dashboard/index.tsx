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
import { Text, Button, useTheme } from "@ui-kitten/components"
import { RefreshCw } from 'lucide-react-native';
import QuickActions from './QuickActions';
import { useAuth } from '@/shared/context/AuthContext';

export default function Dashboard() {
  const theme = useTheme();
  const [lisDraws, draws, isLoading, errorDraws] = useDataFetch(DrawService.list);
  const { user } = useAuth();
  const [getFinancial, summary, isLoadingFinancial] = useDataFetch<FinancialSummary, any>(FinancialSummaryService.get);

  useEffect(() => {
    getFinancial();
    lisDraws(user?.structure?.id);
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
      <Header />
      {/* Financial Summary Cards */}
      <View style={styles.summaryContainer}>
           
        <Button
          appearance='ghost'
          status='basic'
          accessoryLeft={<RefreshCw size={20} color={theme['text-basic-color']} />}
          onPress={() => lisDraws(user?.structure?.id)}
        >
          Actualizar
        </Button>
      </View>

      {/* Draws List */}
      <View style={styles.drawsContainer}>
        <View style={styles.drawsHeader}>
          <Text style={styles.summaryTitle}>Sorteos Disponibles</Text>

        </View>
        {draws?.map((draw, index) => (
          <DrawItem
            key={draw.id}
            draw={draw}
            onPress={handleRulesPress}
            index={index}
          />
        ))}
      </View>
      { /*<QuickActions />*/}
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
  drawsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});