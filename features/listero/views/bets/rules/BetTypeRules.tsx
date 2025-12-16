import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Spinner } from '@ui-kitten/components';
import { ValidationRuleService, ValidationRule } from '@/shared/services/ValidationRule';
import { RewardRuleService, RewardRule } from '@/shared/services/RewardRule';
import RuleItem from './RuleItem';
import LayoutConstants from '@/constants/Layout';

interface BetTypeRulesProps {
    betTypeId: string;
    betTypeName: string;
}

/**
 * Component to display validation and reward rules for a specific bet type
 */
export default function BetTypeRules({ betTypeId, betTypeName }: BetTypeRulesProps) {
    const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
    const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchRules = async () => {
            setIsLoading(true);
            try {
                const [validationData, rewardData] = await Promise.all([
                    ValidationRuleService.getByBetType(betTypeId),
                    RewardRuleService.getByBetType(betTypeId),
                ]);

                setValidationRules(validationData);
                setRewardRules(rewardData);
            } catch (error) {
                console.error('Error fetching bet type rules:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (betTypeId) {
            fetchRules();
        }
    }, [betTypeId]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Spinner size="large" />
                <Text style={styles.loadingText}>Cargando reglas para {betTypeName}...</Text>
            </View>
        );
    }

    const totalRules = validationRules.length + rewardRules.length;

    if (totalRules === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text appearance="hint">
                    No hay reglas específicas para {betTypeName}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.headerCard}>
                <Text category="h6">{betTypeName}</Text>
                <Text category="s1" appearance="hint">
                    {totalRules} regla(s) aplicable(s)
                </Text>
            </Card>

            {validationRules.length > 0 && (
                <View style={styles.section}>
                    <Text category="h6" style={styles.sectionTitle}>
                        Reglas de Validación ({validationRules.length})
                    </Text>
                    {validationRules.map((rule) => (
                        <RuleItem key={rule.id} rule={rule} type="validation" />
                    ))}
                </View>
            )}

            {rewardRules.length > 0 && (
                <View style={styles.section}>
                    <Text category="h6" style={styles.sectionTitle}>
                        Reglas de Premiación ({rewardRules.length})
                    </Text>
                    {rewardRules.map((rule) => (
                        <RuleItem key={rule.id} rule={rule} type="reward" />
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerCard: {
        marginBottom: LayoutConstants.spacing.md,
    },
    section: {
        marginBottom: LayoutConstants.spacing.lg,
    },
    sectionTitle: {
        marginBottom: LayoutConstants.spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: LayoutConstants.spacing.xl,
    },
    loadingText: {
        marginTop: LayoutConstants.spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: LayoutConstants.spacing.xl,
    },
});
