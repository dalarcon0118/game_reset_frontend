import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { Calendar, Trophy, Hash } from 'lucide-react-native';
import { WinningRecordGroup } from '../../core/types';

interface AllWinnersCardProps {
  recordGroup: WinningRecordGroup;
}

/**
 * AllWinnersCard: Reutilizando el estilo visual de PrizeTableCard
 * para mostrar los resultados ganadores de forma consistente.
 */
export const AllWinnersCard: React.FC<AllWinnersCardProps> = ({ recordGroup }) => {
  const theme = useTheme();

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
    <View style={styles.cardContainer}>
      {/* Header con fecha */}
      <View style={styles.headerRow}>
        <View style={styles.dateWrapper}>
          <Calendar size={18} color={theme['color-primary-500']} />
          <Text category="s1" style={styles.dateText}>
            {formatDate(recordGroup.date)}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text category="c1" style={styles.countText}>
            {(recordGroup.entries as any)[0]?.real_winners_count ?? totalWinners} ganadores
          </Text>
        </View>
      </View>

      {/* Lista de ganadores */}
      <View style={styles.winningsList}>
        {recordGroup.entries.map((entry, index) => (
          <View 
            key={entry.id || index} 
            style={styles.winningItem}
          >
            <View style={styles.betTypeBadge}>
              <Trophy size={14} color={theme['color-info-600']} />
              <Text category="c1" style={styles.betTypeCode}>
                {entry.bet_type_code}
              </Text>
            </View>
            <View style={styles.numberRow}>
              <Hash size={16} color={theme['color-basic-600']} />
              <Text category="h6" style={styles.winningNumber}>
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
  cardContainer: {
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
  headerRow: {
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
  winningsList: {
    gap: 12,
  },
  winningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winningNumber: {
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});

export default AllWinnersCard;
