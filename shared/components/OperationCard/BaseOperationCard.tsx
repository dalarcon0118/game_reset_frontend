import React from 'react';
import { View, StyleSheet, TouchableOpacity, GestureResponderEvent, ActivityIndicator } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import { COLORS } from '@/shared/components/constants';
import { Flex, Card, IconBox, Label, ButtonKit } from '@/shared/components';
import { WebData } from '@/shared/core/remote.data';
import { NodeFinancialSummary } from '@/shared/services/FinancialSummary';
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
  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card} padding={0}>
        <View style={[styles.topBar, { backgroundColor: COLORS.primary }]} />

        <Flex align="center" gap={12} style={styles.container}>
          <IconBox>
            <Briefcase size={20} color={COLORS.textLight} />
          </IconBox>

          <Flex vertical flex={1} gap={2} width={"100%"}>
            <Flex justify="between" align="center">
              <Flex vertical gap={2} flex={1}>
                <Label
                  type="header"
                  value={name}
                  numberOfLines={1}
                  ellipsizeMode="tail"
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

            {match(financialData)
              .with({ type: 'Loading' }, () => (
                <Flex align="center" justify="center" style={styles.statsContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </Flex>
              ))
              .with({ type: 'Success' }, ({ data }) => (
                <Flex wrap="wrap" gap={8} style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Label type="detail" style={styles.detailLabel} value="Total:" />
                    <Label type="detail" style={styles.detailValue} value={formatCurrency(data.total_collected || 0)} />
                  </View>
                  <View style={styles.statItem}>
                    <Label type="detail" style={styles.detailLabel} value="Neto:" />
                    <Label type="detail" style={styles.detailValue} value={formatCurrency(data.total_net || 0)} />
                  </View>
                  <View style={styles.statItem}>
                    <Label type="detail" style={styles.detailLabel} value="Perdido:" />
                    <Label type="detail" style={styles.detailValue} value={formatCurrency(data.total_paid || 0)} />
                  </View>
                  <View style={styles.statItem}>
                    <Label type="detail" style={styles.detailLabel} value="Comisión:" />
                    <Label type="detail" style={styles.detailValue} value={formatCurrency(data.commissions || 0)} />
                  </View>
                </Flex>
              ))
              .otherwise(() => (
                 <Flex align="center" justify="center" style={styles.statsContainer}>
                    <Label type="detail" value="Error al cargar datos" />
                 </Flex>
              ))}

            <Flex justify="end" margin={[{ type: "top", value: 8 }]}>
              <ButtonKit
                label="Reglamento"
                size="small"
                appearance="outline"
                onPress={(e: GestureResponderEvent) => {
                  e?.stopPropagation?.();
                  onReglamentoPress?.();
                }}
                style={styles.reglamentoButton}
              />
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    paddingRight: 10,
    minHeight: 180,
  },
  container: {
    marginTop: 5,
    paddingLeft: 10,
  },
  drawSummary: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  statsContainer: {
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  topBar: {
    marginLeft: 14,
    height: 4,
    width: '95%',
  },
  reglamentoButton: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
  },
});
