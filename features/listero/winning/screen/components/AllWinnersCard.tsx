import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Calendar, Trophy, Hash } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { WinningRecordGroup } from '../../core/types';

interface AllWinnersCardProps {
  recordGroup: WinningRecordGroup;
}

export const AllWinnersCard: React.FC<AllWinnersCardProps> = ({ recordGroup }) => {
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

  const totalWinners = recordGroup.entries.length;

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.dateWrapper}>
          <Calendar size={18} color={theme.primary} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            {formatDate(recordGroup.date)}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
            {(recordGroup.entries as any)[0]?.real_winners_count ?? totalWinners} ganadores
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {recordGroup.entries.map((entry, index) => (
          <View key={entry.id || index} style={[styles.item, { borderBottomColor: theme.border }]}>
            <View style={[styles.badgeRow, { backgroundColor: theme.primaryLight }]}>
              <Trophy size={14} color={theme.primary} />
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {entry.bet_type_code}
              </Text>
            </View>
            <View style={styles.numberRow}>
              <Hash size={16} color={theme.textSecondary} />
              <Text style={[styles.numberText, { color: theme.text }]}>
                {entry.winning_number}
              </Text>
            </View>
          </View>
        ))}
      </View>
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
  header: {
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberText: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default AllWinnersCard;