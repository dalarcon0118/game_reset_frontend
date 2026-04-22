import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
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

export const WinnerDayCard: React.FC<WinnerDayCardProps> = ({ drawGroup, winnings = [] }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const totalPayout = drawGroup.winnings.reduce((sum, w) => sum + Number(w.payout_amount), 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={[styles.dateHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.dateWrapper}>
          <Calendar size={18} color={theme.primary} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            {formatDate(drawGroup.date)}
          </Text>
        </View>
      </View>

      <View style={styles.drawInfo}>
        <Text style={[styles.drawNameText, { color: theme.textSecondary }]}>
          {drawGroup.drawName}
        </Text>
      </View>

      <View style={styles.winningsList}>
        {drawGroup.winnings.map((win, index) => (
          <View key={win.id || index} style={[styles.winningItem, { borderBottomColor: theme.border }]}>
            <View style={styles.winningItemLeft}>
              {win.bet_type_details?.name && (
                <View style={[styles.betTypeBadge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.betTypeCode, { color: theme.primary }]}>
                    {win.bet_type_details.name}
                  </Text>
                </View>
              )}
              <View style={styles.betDetails}>
                <Text style={[styles.numbersText, { color: theme.text }]}>
                  {formatNumbersPlayed(win.numbers_played)}
                </Text>
                {win.receipt_code && (
                  <Text style={[styles.receiptText, { color: theme.textSecondary }]}>
                    {win.receipt_code}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.winningItemRight}>
              <Text style={[styles.payoutText, { color: theme.success }]}>
                +{Number(win.payout_amount).toLocaleString('es-ES')}
              </Text>
              <Text style={[styles.payoutLabel, { color: theme.textSecondary }]}>
                Premio
              </Text>
            </View>
          </View>
        ))}
      </View>

      {totalPayout > 0 && (
        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>
            Total ganado:
          </Text>
          <Text style={[styles.totalText, { color: theme.success }]}>
            {totalPayout.toLocaleString('es-ES')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 16,
  },
  drawInfo: {
    marginBottom: 12,
  },
  drawNameText: {
    fontWeight: '600',
    fontSize: 14,
  },
  winningsList: {
    gap: 8,
  },
  winningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  winningItemLeft: {
    flex: 1,
  },
  winningItemRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  betTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  betTypeCode: {
    fontWeight: '700',
    fontSize: 11,
  },
  betDetails: {
    marginTop: 2,
  },
  numbersText: {
    fontWeight: '900',
    letterSpacing: 0.5,
    fontSize: 16,
  },
  receiptText: {
    fontSize: 12,
    marginTop: 2,
  },
  payoutText: {
    fontWeight: '800',
    fontSize: 16,
  },
  payoutLabel: {
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  totalText: {
    fontWeight: '900',
    fontSize: 20,
  },
});

export default WinnerDayCard;