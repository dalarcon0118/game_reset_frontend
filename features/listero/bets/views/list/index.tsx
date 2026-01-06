import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../../../../constants/Colors';
import AppLayout from '../../../../../constants/Layout';
import FijosCorridosColumn from './components/FijosCorridosColumn';
import ParletColumn from './components/ParletColumn';
import CentenasColumn from './components/CentenasColumn';
import StyledText from '../../../../../components/typography/StyledText';
import { Layout, Text } from '@ui-kitten/components';
import { useBets } from '../../hooks/useBets';

interface BetsListScreenProps {
  drawId?: string;
  title?:string;
}

export default function BetsListScreen({ drawId, title }: BetsListScreenProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  const {
    fijosCorridos,
    parlets,
    centenas,
    isLoading,
    error,
    fetchBets
  } = useBets();

  // Trigger fetch when drawId changes
  useEffect(() => {
    if (drawId) {
      fetchBets(drawId);
    }
  }, [drawId, fetchBets]);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <StyledText style={{ color: 'red' }}>Error loading bets: {error}</StyledText>
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
          <FijosCorridosColumn bets={fijosCorridos as any} />
          <ParletColumn bets={parlets as any} />
          <CentenasColumn bets={centenas as any} />
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
      paddingVertical: AppLayout.spacing.xs,
      paddingHorizontal: AppLayout.spacing.xs,
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
