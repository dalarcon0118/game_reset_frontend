import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Wallet, Hash } from 'lucide-react-native';
import { WinningDrawGroup } from '../../core/types';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';

function formatNumbersPlayed(numbers: WinningBet['numbers_played']): string {
  if (!numbers) return '';
  if (typeof numbers === 'string') return numbers;
  if (Array.isArray(numbers)) return (numbers as string[]).join(', ');
  if (typeof numbers === 'object' && numbers !== null) {
    const obj = numbers as Record<string, unknown>;
    if (obj.numbers && Array.isArray(obj.numbers)) return (obj.numbers as string[]).join(', ');
    return JSON.stringify(numbers);
  }
  return String(numbers);
}

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
    <View style={styles.card}>
      {/* Header con fecha */}
      <View style={styles.dateHeader}>
        <View style={styles.dateWrapper}>
          <Calendar size={18} color="#1565C0" />
          <Text style={styles.dateText}>
            {formatDate(drawGroup.date)}
          </Text>
        </View>
      </View>

      {/* Sorteo info */}
      <View style={styles.drawInfo}>
        <Text style={styles.drawNameText}>
          {drawGroup.drawName}
        </Text>
      </View>

      {/* Lista de winning bets */}
      <View style={styles.winningsList}>
        {drawGroup.winnings.map((win, index) => (
          <View key={win.id || index} style={styles.winningItem}>
            <View style={styles.winningItemLeft}>
              {win.bet_type_details?.name && (
                <View style={styles.betTypeBadge}>
                  <Text style={styles.betTypeCode}>
                    {win.bet_type_details.name}
                  </Text>
                </View>
              )}
              <View style={styles.betDetails}>
                <Text style={styles.numbersText}>
                  {formatNumbersPlayed(win.numbers_played)}
                </Text>
              </View>
            </View>
            <View style={styles.winningItemRight}>
              <Text style={styles.payoutText}>
                +{Number(win.payout_amount).toLocaleString('es-ES')}
              </Text>
              <Text style={styles.payoutLabel}>
                Premio
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Total */}
      {totalPayout > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total ganado:
          </Text>
          <Text style={styles.totalText}>
            {totalPayout.toLocaleString('es-ES')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontWeight: '700',
    marginLeft: 8,
    color: '#000000',
  },
  countBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontWeight: '800',
    color: '#666',
  },
  drawInfo: {
    marginBottom: 12,
  },
  drawNameText: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
winningsList: {
    gap: 12,
  },
  winningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  winningItemLeft: {
    flex: 1,
  },
  winningItemRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  betTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  betTypeCode: {
    fontWeight: '800',
    color: '#1565C0',
    marginLeft: 4,
    fontSize: 12,
  },
  betDetails: {
    flex: 1,
    marginLeft: 12,
  },
  numbersText: {
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    fontSize: 16,
  },
  receiptText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  payoutInfo: {
    alignItems: 'flex-end',
  },
  payoutText: {
    fontWeight: '900',
    color: '#22C55E',
    fontSize: 16,
  },
  payoutLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  totalLabel: {
    fontWeight: '700',
    color: '#000000',
    fontSize: 14,
  },
  totalText: {
    fontWeight: '900',
    color: '#22C55E',
    fontSize: 20,
  },
});

export default WinnerDayCard;
