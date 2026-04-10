import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@shared/components/card';
import { COLORS } from '@shared/components/constants';
import { PerformanceItem } from '../../api/bank_report_api';

interface OperationsTableProps {
  performance: PerformanceItem[];
}

const getBadgeStyles = (classColor: string) => {
  switch (classColor) {
    case 'badge-green':
      return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
    case 'badge-blue':
      return { backgroundColor: '#E3F2FD', color: '#1565C0' };
    case 'badge-gray':
      return { backgroundColor: '#F5F5F5', color: '#616161' };
    case 'badge-red':
      return { backgroundColor: '#FFEBEE', color: '#C62828' };
    default:
      return { backgroundColor: COLORS.border, color: COLORS.textDark };
  }
};

const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const OperationsTable: React.FC<OperationsTableProps> = ({ performance }) => {
  return (
    <Card style={styles.container} padding={0}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerTitle}>Detalle de Operaciones</Text>
        <View style={styles.btnGroup}>
          <View style={[styles.smallBtn, styles.smallBtnActive]}>
            <Text style={styles.smallBtnTextActive}>Todas</Text>
          </View>
          <View style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Activas</Text>
          </View>
          <View style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Inactivas</Text>
          </View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.thListeria]}>LISTERÍA</Text>
            <Text style={[styles.th, styles.thClass]}>CLASIFICACIÓN</Text>
            <Text style={[styles.th, styles.thBets]}>APUESTAS</Text>
            <Text style={[styles.th, styles.thRecaudacion]}>RECAUDACIÓN</Text>
            <Text style={[styles.th, styles.thShare]}>% DEL TOTAL</Text>
          </View>
          {performance.map((item, index) => {
            const badgeStyles = getBadgeStyles(item.class_color);
            return (
              <View key={`${item.name}-${index}`} style={styles.tableRow}>
                <Text style={[styles.td, styles.tdListeria]}>{item.name}</Text>
                <View style={styles.tdClass}>
                  <View style={[styles.badge, { backgroundColor: badgeStyles.backgroundColor }]}>
                    <Text style={[styles.badgeText, { color: badgeStyles.color }]}>{item.class_name}</Text>
                  </View>
                </View>
                <Text style={[styles.td, styles.tdBets]}>{item.bets_count}</Text>
                <Text style={[styles.td, styles.tdRecaudacion]}>{formatCurrency(item.total_in)}</Text>
                <Text style={[styles.td, styles.tdShare]}>{parseFloat(item.share).toFixed(2)}%</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  smallBtnActive: {
    backgroundColor: COLORS.textDark,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  smallBtnTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.cardBg,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textLight,
  },
  thListeria: {
    width: 150,
  },
  thClass: {
    width: 120,
    textAlign: 'center',
  },
  thBets: {
    width: 80,
    textAlign: 'center',
  },
  thRecaudacion: {
    width: 120,
    textAlign: 'right',
  },
  thShare: {
    width: 80,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  td: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tdListeria: {
    width: 150,
    color: COLORS.textDark,
    fontWeight: '700',
  },
  tdClass: {
    width: 120,
    alignItems: 'center',
  },
  tdBets: {
    width: 80,
    textAlign: 'center',
  },
  tdRecaudacion: {
    width: 120,
    textAlign: 'right',
  },
  tdShare: {
    width: 80,
    textAlign: 'right',
    color: COLORS.border,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});