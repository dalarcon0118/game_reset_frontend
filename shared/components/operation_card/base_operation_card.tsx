import React from 'react';
import { View, StyleSheet, TouchableOpacity, GestureResponderEvent, ActivityIndicator } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import { COLORS } from '@/shared/components/constants';
import { Flex, Card, IconBox, Label, ButtonKit } from '@/shared/components';
import { WebData } from '@core/tea-utils';
import { NodeFinancialSummary } from '@/shared/repositories/financial';
import { match } from 'ts-pattern';

interface BaseOperationCardProps {
  name: string;
  financialData: WebData<NodeFinancialSummary>;
  onPress?: () => void;
  onReglamentoPress?: () => void;
}

export const BaseOperationCard: React.FC<BaseOperationCardProps> = ({ 
  name, 
  financialData, 
  onPress, 
  onReglamentoPress 
}) => {
  const formatCurrency = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card style={styles.card} padding={0} onPress={onPress}>
      <Flex padding={16} vertical gap={16}>
        {/* Header Section */}
        <Flex align="center" gap={12}>
          <IconBox 
            size={44} 
            backgroundColor={COLORS.primary + '15'} 
            style={{ borderRadius: 12 }}
          >
            <Briefcase size={22} color={COLORS.primary} />
          </IconBox>
          <Flex vertical flex={1} gap={2}>
            <Label
              type="header"
              value={name}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.headerLabel}
            />
            <Label
              type="detail"
              value={match(financialData)
                .with({ type: 'Loading' }, () => 'Cargando sorteos...')
                .with({ type: 'Success' }, ({ data }) => data.draw_summary || 'N/A')
                .otherwise(() => 'N/A')}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.drawSummary}
            />
          </Flex>
        </Flex>

        {/* Stats Section */}
        {match(financialData)
          .with({ type: 'Loading' }, () => (
            <Flex align="center" justify="center" style={styles.statsGrid}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </Flex>
          ))
          .with({ type: 'Success' }, ({ data }) => (
            <View style={styles.statsGrid}>
              <Flex direction="row" justify="between" align="center" style={styles.statsRow}>
                <Flex vertical gap={4} flex={1}>
                  <Label type="detail" style={styles.statLabel} value="TOTAL RECAUDADO" />
                  <Label type="header" style={styles.statValue} value={formatCurrency(data.total_collected || 0)} />
                </Flex>
                <View style={styles.verticalDivider} />
                <Flex vertical gap={4} flex={1} style={{ paddingLeft: 12 }}>
                  <Label type="detail" style={styles.statLabel} value="NETO" />
                  <Label type="header" style={[styles.statValue, { color: '#27ae60' }]} value={formatCurrency(data.total_net || 0)} />
                </Flex>
              </Flex>
              
              <View style={styles.horizontalDivider} />

              <Flex direction="row" justify="between" align="center" style={styles.statsRow}>
                <Flex vertical gap={4} flex={1}>
                  <Label type="detail" style={styles.statLabel} value="PREMIOS" />
                  <Label type="header" style={[styles.statValue, { color: '#e74c3c' }]} value={formatCurrency(data.total_paid || 0)} />
                </Flex>
                <View style={styles.verticalDivider} />
                <Flex vertical gap={4} flex={1} style={{ paddingLeft: 12 }}>
                  <Label type="detail" style={styles.statLabel} value="COMISIÓN" />
                  <Label type="header" style={styles.statValue} value={formatCurrency(data.commissions || 0)} />
                </Flex>
              </Flex>
            </View>
          ))
          .otherwise(() => (
             <Flex align="center" justify="center" style={styles.statsGrid}>
                <Label type="detail" value="Error al cargar datos" />
             </Flex>
          ))}

        {/* Footer Actions */}
        <Flex justify="end">
          <ButtonKit
            label="Ver Reglamento"
            size="small"
            appearance="ghost"
            status="primary"
            onPress={(e: GestureResponderEvent) => {
              e?.stopPropagation?.();
              onReglamentoPress?.();
            }}
            style={styles.reglamentoButton}
            labelStyle={{ fontWeight: '700' }}
          />
        </Flex>
      </Flex>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  headerLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  drawSummary: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  statsGrid: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 12,
  },
  statsRow: {
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#95a5a6',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
  },
  horizontalDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  reglamentoButton: {
    height: 36,
    borderRadius: 10,
  },
});
