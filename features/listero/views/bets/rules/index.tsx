import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Spinner } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

import useDataFetch from '@/shared/hooks/useDataFetch';
import { RulesService, ValidationRule, RewardRule } from '@/shared/services/rules';
import RuleItem from './RuleItem';
import LayoutConstants from '@/constants/Layout';

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
  const [listRules, rulesData, isLoadingRules, errorRules] = useDataFetch(
    RulesService.getAllRulesForDraw
  );

  // Fetch rules when drawId changes
  useEffect(() => {
    if (drawId) {
      listRules(drawId);
    }
  }, [drawId, listRules]);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with draw and structure info */}
      {rulesData && (
        <View style={styles.titleContainer}>
          <Text category="h5" style={styles.title}>
            {rulesData.draw_name}
          </Text>
          <Text category="s1" appearance="hint" style={styles.subtitle}>
            Estructura: {rulesData.structure_name}
          </Text>
        </View>
      )}

      {/* Rules List */}
      <ScrollView style={styles.content}>
        {isLoadingRules ? (
          <View style={styles.loadingContainer}>
            <Spinner size="large" />
            <Text style={styles.loadingText}>Cargando reglas del sorteo...</Text>
          </View>
        ) : errorRules ? (
          <View style={styles.emptyContainer}>
            <Text appearance="hint" status="danger">
              Error al cargar las reglas
            </Text>
          </View>
        ) : allRules.length > 0 ? (
          <View style={styles.rulesContainer}>
            {/* Stats Header */}
            <View style={styles.statsContainer}>
              <Text category="s1" appearance="hint">
                Total: {stats.total} regla(s)
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Text category="c2" style={styles.statLabel}>
                    Validación: {stats.validationCount}
                  </Text>
                </View>
                <View style={[styles.statBadge, styles.statBadgeReward]}>
                  <Text category="c2" style={styles.statLabel}>
                    Premiación: {stats.rewardCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Rules List */}
            {allRules.map((rule) => (
              <RuleItem key={`${rule.type}-${rule.id}`} rule={rule} type={rule.type} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text appearance="hint">No hay reglas disponibles para este sorteo</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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