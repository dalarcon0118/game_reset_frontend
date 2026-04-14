import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { ExtendedDrawType } from '@/shared/services/draw/types';

interface WinnerCardProps {
  draw: ExtendedDrawType;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({ draw }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const winningNumbers = draw.winning_numbers;
  const displayNumbers = typeof winningNumbers === 'string' 
    ? winningNumbers 
    : winningNumbers?.winning_number || 'N/A';

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.drawHeader}>
        <Text category="s2" style={{ color: theme.text }}>
          {draw.name}
        </Text>
        <Text category="c1" appearance="hint">
          {draw.date} {draw.time}
        </Text>
      </View>
      
      <View style={styles.winningNumbersContainer}>
        <Text category="s1" style={styles.winningLabel}>Número Ganador</Text>
        <Text category="headlineMedium" style={[styles.winningNumber, { color: theme.primary }]}>
          {displayNumbers}
        </Text>
      </View>

      <View style={[styles.drawMeta, { borderTopColor: theme.border }]}>
        <Text category="c2" appearance="hint">
          Estado: {draw.status === 'closed' ? 'Cerrado' : draw.status}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  },
});
