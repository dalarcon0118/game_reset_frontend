import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { WinningDrawGroup } from '../../core/types';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

interface WinnerDayCardProps {
  drawGroup: WinningDrawGroup;
  winnings?: WinningBet[];
}

/**
 * Card para mostrar los números winners de un día específico
 * 
 * REFACTOR: Este componente muestra WinningDrawGroup en lugar de ExtendedDrawType.
 * Los datos vienen de BetRepository.getMyWinnings().
 */
export const WinnerDayCard: React.FC<WinnerDayCardProps> = ({ drawGroup, winnings = [] }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Formatear fecha
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total payout
  const totalPayout = drawGroup.winnings.reduce((sum, w) => sum + w.payout_amount, 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {/* Header con fecha */}
      <View style={styles.dateHeader}>
        <View style={[styles.dateBadge, { backgroundColor: theme.primary + '20' }]}>
          <Calendar size={16} color={theme.primary} />
          <Text category="s2" style={{ color: theme.primary, marginLeft: 6 }}>
            {formatDate(drawGroup.date)}
          </Text>
        </View>
        <Text category="c1" appearance="hint">
          {drawGroup.winnings.length} apuesta{drawGroup.winnings.length !== 1 ? 's' : ''} winner{drawGroup.winnings.length !== 1 ? 'as' : ''}
        </Text>
      </View>

      {/* Sorteo info */}
      <View style={styles.drawInfo}>
        <Text category="h6" style={{ color: theme.text }}>
          {drawGroup.drawName}
        </Text>
      </View>

      {/* Lista de winning bets */}
      <View style={styles.winningsList}>
        {drawGroup.winnings.map((win, index) => (
          <View key={win.id || index} style={[styles.winningItem, { borderTopColor: theme.border }]}>
            <View style={styles.winningDetails}>
              <View style={styles.betInfo}>
                <Text category="s2" style={{ color: theme.text }}>
                  {win.bet_type_details?.name || `Premio #${index + 1}`}
                </Text>
                <Text category="c2" appearance="hint">
                  Número jugado: {win.numbers_played}
                </Text>
              </View>
              <View style={styles.payoutInfo}>
                <Text category="s1" style={{ color: theme.success || '#22C55E' }}>
                  +{win.payout_amount.toLocaleString()}
                </Text>
                <Text category="c2" appearance="hint">
                  Payout
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Total */}
      {totalPayout > 0 && (
        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
          <Text category="s1" style={{ color: theme.text }}>
            Total ganado:
          </Text>
          <Text category="h6" style={{ color: theme.success || '#22C55E' }}>
            {totalPayout.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  drawInfo: {
    marginBottom: 12,
  },
  winningsList: {
    marginTop: 4,
  },
  winningItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  winningDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betInfo: {
    flex: 1,
  },
  payoutInfo: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});

export default WinnerDayCard;
