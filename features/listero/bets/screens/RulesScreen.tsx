import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Spinner } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBetsStore, selectBetsModel, selectDispatch } from '../core/store';
import { RewardsRulesMsgType } from '../features/rewards-rules/rewards.types';
import { ValidationRule, RewardRule } from '@/shared/services/rules';
import RuleItem from './RuleItem';
import LayoutConstants from '@/constants/Layout';
import { Flex, Label, Badge, Card, withDataView } from '@/shared/components';

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

export const RulesScreen: React.FC<RulesScreenProps> = ({ drawId }) => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { rules } = model;
    const rulesData = rules.data;
    const isLoadingRules = rules.isLoading;
    const errorRules = rules.error;

    useEffect(() => {
        if (drawId) {
            dispatch({
                type: 'REWARDS_RULES',
                payload: { type: RewardsRulesMsgType.FETCH_RULES_REQUESTED, drawId }
            });
        }
    }, [drawId, dispatch]);

    const allRules = useMemo<UnifiedRule[]>(() => {
        if (!rulesData) return [];
        const validationRules: UnifiedRule[] = (rulesData.validation_rules || []).map((rule: ValidationRule) => ({ ...rule, type: 'validation' as const }));
        const rewardRules: UnifiedRule[] = (rulesData.reward_rules || []).map((rule: RewardRule) => ({ ...rule, type: 'reward' as const }));
        return [...validationRules, ...rewardRules].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }, [rulesData]);

    const stats = useMemo(() => ({
        validationCount: allRules.filter((r) => r.type === 'validation').length,
        rewardCount: allRules.filter((r) => r.type === 'reward').length,
        total: allRules.length,
    }), [allRules]);

    const RulesContent = () => (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {rulesData && (
                <Card padding={8} style={{ marginBottom: 0 }}>
                    <Flex vertical align="center">
                        <Label type="header" value={rulesData.draw_name} />
                        <Label type="detail" value={`Estructura: ${rulesData.structure_name}`} />
                    </Flex>
                </Card>
            )}
            <ScrollView style={styles.content}>
                <View style={styles.rulesContainer}>
                    <Card padding={4} style={styles.statsContainer}>
                        <Flex vertical gap={4}>
                            <Label type="subheader" value={`Total: ${stats.total} regla(s)`} />
                            <Flex gap={4}>
                                <Badge content={`Validación: ${stats.validationCount}`} color="#FFF4E6" textColor="#FFAA00" />
                                <Badge content={`Premiación: ${stats.rewardCount}`} color="#E7F5EC" textColor="#00C48C" />
                            </Flex>
                        </Flex>
                    </Card>
                    {allRules.map((rule) => (
                        <RuleItem key={`${rule.type}-${rule.id}`} rule={rule} type={rule.type} />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );

    const RulesScreenWithDataView = withDataView(RulesContent);

    return (
        <RulesScreenWithDataView
            loading={isLoadingRules}
            error={errorRules}
            isEmpty={allRules.length === 0}
            onRetry={() => dispatch({ type: 'REWARDS_RULES', payload: { type: RewardsRulesMsgType.FETCH_RULES_REQUESTED, drawId: drawId || '' } })}
            emptyMessage="No hay reglas disponibles para este sorteo"
            errorMessage="Error al cargar las reglas del sorteo"
        />
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FC' },
    content: { flex: 1 },
    rulesContainer: { padding: LayoutConstants.spacing.md },
    statsContainer: { marginBottom: LayoutConstants.spacing.md, padding: LayoutConstants.spacing.sm, backgroundColor: 'white', borderRadius: LayoutConstants.borderRadius.md, borderWidth: 1, borderColor: '#E4E9F2' },
});
