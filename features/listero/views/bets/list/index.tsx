import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import ColumnHeaders from './components/ColumnHeaders';
import FijosCorridosColumn from './components/FijosCorridosColumn';
import ParletColumn from './components/ParletColumn';
import CentenasColumn from './components/CentenasColumn';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { BetService } from '@/shared/services/Bet';
import StyledText from '@/components/typography/StyledText';
import { BetsListMapper } from './BetsListMapper';
import { Layout, Text } from '@ui-kitten/components';
import LayoutConstants from '@/constants/Layout';


interface BetsListScreenProps {
  drawId?: string;
  title?:string;
}

export default function BetsListScreen({ drawId,title }: BetsListScreenProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Use useDataFetch to manage the async call
  const [fetchBets, bets, isLoadingBets, errorBets] = useDataFetch(BetService.list);

  // Trigger fetch when drawId changes
  useEffect(() => {
    if (drawId) {
      fetchBets({ drawId });
    }
  }, [drawId, fetchBets]);

  // Process bets into categories using the mapper
  const { fijosCorridos, parlets, centenas } = useMemo(() => {
    if (!bets) return { fijosCorridos: [], parlets: [], centenas: [] };
    return BetsListMapper.transform(bets);
  }, [bets]);

  if (isLoadingBets) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  if (errorBets) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <StyledText style={{ color: 'red' }}>Error loading bets: {errorBets.message}</StyledText>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
        <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
          <Text category='h6' style={styles.title}>{title}</Text>
        </Layout>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.gridContainer}>
          <FijosCorridosColumn bets={fijosCorridos} />
          <ParletColumn bets={parlets} />
          <CentenasColumn bets={centenas} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  header: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 0,
      paddingVertical: LayoutConstants.spacing.xs,
      paddingHorizontal: LayoutConstants.spacing.xs,
      borderBottomWidth: 1,
    },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
  },
});
