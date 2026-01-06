import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Spinner } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBets } from '../../hooks/useBets';
import { ValidationRule, RewardRule } from '../../../../../shared/services/rules';
import RuleItem from './RuleItem';
import LayoutConstants from '../../../../../constants/Layout';
import { Flex, Label, Badge, Card, withDataView } from '../../../../../shared/components';

interface RulesScreenProps {
  drawId?: string;
}

// Tipo unificado para todas las reglas
interface UnifiedRule {
  id: string;
  name: string;
  description: string;
  type: 'validation' | 'reward';
  json_logic: any;
  is_active: boolean;
  bet_types: string[];
  created_at: string;
  updated_at: string;
}

export default function RulesScreen({ drawId }: RulesScreenProps) {
  const { rules, fetchRules } = useBets();
  const rulesData = rules.data;
  const isLoadingRules = rules.isLoading;
  const errorRules = rules.error;

  // Fetch rules when drawId changes
  useEffect(() => {
    if (drawId) {
      fetchRules(drawId);
    }
  }, [drawId, fetchRules]);

  // Mapper: Combina validation y reward rules en una sola lista
  const allRules = useMemo<UnifiedRule[]>(() => {
    if (!rulesData) return [];

    const validationRules: UnifiedRule[] = (rulesData.validation_rules || []).map(
      (rule: ValidationRule) => ({
        ...rule,
        type: 'validation' as const,
      })
    );

    const rewardRules: UnifiedRule[] = (rulesData.reward_rules || []).map(
      (rule: RewardRule) => ({
        ...rule,
        type: 'reward' as const,
      })
    );

    // Combinar y ordenar por fecha de actualización (más recientes primero)
    return [...validationRules, ...rewardRules].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [rulesData]);

  // Estadísticas de reglas
  const stats = useMemo(() => {
    const validationCount = allRules.filter((r) => r.type === 'validation').length;
    const rewardCount = allRules.filter((r) => r.type === 'reward').length;
    return { validationCount, rewardCount, total: allRules.length };
  }, [allRules]);

  // Create RulesContent component for withDataView
  const RulesContent = () => (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with draw and structure info */}
      {rulesData && (
        <Card padding="m" style={{ marginBottom: 0 }}>
          <Flex vertical align="center">
            <Label type="header" value={rulesData.draw_name} />
            <Label type="detail" value={`Estructura: ${rulesData.structure_name}`} />
          </Flex>
        </Card>
      )}

      {/* Rules List */}
      <ScrollView style={styles.content}>
        <View style={styles.rulesContainer}>
          {/* Stats Header */}
          <Card padding="s" style={styles.statsContainer}>
            <Flex vertical gap="s">
              <Label type="subheader" value={`Total: ${stats.total} regla(s)`} />
              <Flex gap="s">
                <Badge content={`Validación: ${stats.validationCount}`} color="#FFF4E6" textColor="#FFAA00" />
                <Badge content={`Premiación: ${stats.rewardCount}`} color="#E7F5EC" textColor="#00C48C" />
              </Flex>
            </Flex>
          </Card>

          {/* Rules List */}
          {allRules.map((rule) => (
            <RuleItem key={`${rule.type}-${rule.id}`} rule={rule} type={rule.type} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Wrap with withDataView for consistent loading/error/empty states
  const RulesScreenWithDataView = withDataView(RulesContent);

  return (
    <RulesScreenWithDataView
      loading={isLoadingRules}
      error={errorRules}
      isEmpty={allRules.length === 0}
      onRetry={() => fetchRules(drawId || '')}
      emptyMessage="No hay reglas disponibles para este sorteo"
      errorMessage="Error al cargar las reglas del sorteo"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  titleContainer: {
    padding: LayoutConstants.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: LayoutConstants.spacing.xs,
  },
  content: {
    flex: 1,
  },
  rulesContainer: {
    padding: LayoutConstants.spacing.md,
  },
  statsContainer: {
    marginBottom: LayoutConstants.spacing.md,
    padding: LayoutConstants.spacing.sm,
    backgroundColor: 'white',
    borderRadius: LayoutConstants.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: LayoutConstants.spacing.xs,
    gap: LayoutConstants.spacing.xs,
  },
  statBadge: {
    paddingHorizontal: LayoutConstants.spacing.sm,
    paddingVertical: LayoutConstants.spacing.xs,
    backgroundColor: '#FFF4E6',
    borderRadius: LayoutConstants.borderRadius.sm,
  },
  statBadgeReward: {
    backgroundColor: '#E7F5EC',
  },
  statLabel: {
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LayoutConstants.spacing.xl,
    minHeight: 300,
  },
  loadingText: {
    marginTop: LayoutConstants.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LayoutConstants.spacing.xl,
    minHeight: 300,
  },
});
