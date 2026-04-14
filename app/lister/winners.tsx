import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { drawRepository } from '@/shared/repositories/draw';
import { Result } from 'neverthrow';
import { WinningRecord } from '@/features/listero/bet-workspace/rewards/core/types';

export default function WinnersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDrawsWithWinners();
  }, []);

  const loadDrawsWithWinners = async () => {
    setLoading(true);
    setError(null);

    // Get draws from today
    const result = await drawRepository.getDraws({ owner_structure: undefined });
    
    if (result.isErr()) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    // Filter draws that have winning numbers (closed/completed)
    const drawsWithWinners = result.value.filter(
      (d: any) => d.status === 'closed' && d.winning_numbers
    );

    setDraws(drawsWithWinners);
    setLoading(false);
  };

  const renderDrawItem = ({ item }: { item: any }) => {
    const winningNumbers = item.winning_numbers;
    const displayNumbers = typeof winningNumbers === 'string' 
      ? winningNumbers 
      : winningNumbers?.number || 'N/A';

    return (
      <View style={[styles.drawCard, { backgroundColor: Colors[colorScheme].card }]}>
        <View style={styles.drawHeader}>
          <Text category="s2" style={{ color: Colors[colorScheme].text }}>
            {item.name}
          </Text>
          <Text category="c1" appearance="hint">
            {item.date} {item.time}
          </Text>
        </View>
        
        <View style={styles.winningNumbersContainer}>
          <Text category="s1" style={styles.winningLabel}>Número Ganador</Text>
          <Text category="headlineMedium" style={[styles.winningNumber, { color: Colors[colorScheme].primary }]}>
            {displayNumbers}
          </Text>
        </View>

        <View style={styles.drawMeta}>
          <Text category="c2" appearance="hint">
            Estado: {item.status === 'closed' ? 'Cerrado' : item.status}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors[colorScheme].background }]}>
        <Text category="p1" status="danger">{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <FlatList
        data={draws}
        keyExtractor={(item: any) => item.id}
        renderItem={renderDrawItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text category="p1" appearance="hint">
              No hay sorteos con números ganadores
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  drawCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  drawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  winningNumbersContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  winningLabel: {
    marginBottom: 4,
  },
  winningNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  drawMeta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
});