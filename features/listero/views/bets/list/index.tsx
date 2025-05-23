import React from 'react';
import { View, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { mockFijosCorridos, mockParlets, mockCentenas } from '@/data/mockData';
import ColumnHeaders from './components/ColumnHeaders';
import FijosCorridosColumn from './components/FijosCorridosColumn';
import ParletColumn from './components/ParletColumn';
import CentenasColumn from './components/CentenasColumn';

interface BetsListScreenProps {
  drawId?: string;
}

export default function BetsListScreen({ drawId }: BetsListScreenProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <ColumnHeaders />
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.gridContainer}>
          <FijosCorridosColumn bets={mockFijosCorridos} />
          <ParletColumn bets={mockParlets} />
          <CentenasColumn bets={mockCentenas} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flex: 1,
  },
});