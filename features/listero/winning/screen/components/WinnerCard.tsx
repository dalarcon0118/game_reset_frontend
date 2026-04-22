import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { ExtendedDrawType } from '@/shared/services/draw/types';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

interface WinnerCardProps {
  draw: ExtendedDrawType;
  winnings?: WinningBet[];
}

export const WinnerCard: React.FC<WinnerCardProps> = ({ draw, winnings = [] }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const winningNumbers = draw.winning_numbers;
  const displayNumbers = typeof winningNumbers === 'string' 
    ? winningNumbers 
    : winningNumbers?.winning_number || 'N/A';
  
  // Filter winnings for this draw
  const drawId = typeof draw.id === 'string' ? parseInt(draw.id, 10) : draw.id;
  const drawWinnings = winnings.filter(w => w.draw === drawId);
  
  // Calculate total payout for this draw
  const totalPayout = drawWinnings.reduce((sum, w) => sum + Number(w.payout_amount), 0);

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

      {/* User's winning bets for this draw */}
      {drawWinnings.length > 0 && (
        <View style={[styles.winningsSection, { borderTopColor: theme.border }]}>
          <Text category="c2" style={{ color: theme.textSecondary, marginBottom: 8 }}>
            Tus apuestas ganadoras:
          </Text>
          {drawWinnings.map((win, index) => (
            <View key={win.id || index} style={styles.winningRow}>
              <View style={styles.winningBetInfo}>
                <Text category="c1" style={{ color: theme.text }}>
                  {win.bet_type_details?.name || `Apuesta #${win.id}`}
                </Text>
                <Text category="c2" appearance="hint">
                  Números: {win.numbers_played}
                </Text>
              </View>
              <View style={styles.winningAmount}>
                <Text category="s2" style={{ color: theme.success }}>
                  +{Number(win.payout_amount).toLocaleString()}
                </Text>
                <Text category="c2" appearance="hint">
                  Apostado: {win.amount.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text category="s1" style={{ color: theme.text }}>
              Total ganado:
            </Text>
            <Text category="s1" style={{ color: theme.success }}>
              {totalPayout.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

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
  winningsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  winningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  winningBetInfo: {
    flex: 1,
  },
  winningAmount: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  drawMeta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
