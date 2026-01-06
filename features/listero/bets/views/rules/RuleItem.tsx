import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from '@ui-kitten/components';
import { ValidationRule } from '@/shared/services/ValidationRule';
import { RewardRule } from '@/shared/services/RewardRule';
import LayoutConstants from '@/constants/Layout';

interface RuleItemProps {
    rule: ValidationRule | RewardRule;
    type: 'validation' | 'reward';
}

export default function RuleItem({ rule, type }: RuleItemProps) {
    const renderJsonLogic = (logic: any) => {
        try {
            return JSON.stringify(logic, null, 2);
        } catch {
            return 'N/A';
        }
    };

    return (
        <Card style={styles.card} status={type === 'validation' ? 'warning' : 'success'}>
            <View style={styles.header}>
                <Text category="h6" style={styles.title}>
                    {rule.name}
                </Text>
                {!rule.is_active && (
                    <View style={styles.inactiveBadge}>
                        <Text category="c2" style={styles.inactiveText}>
                            Inactiva
                        </Text>
                    </View>
                )}
            </View>

            {rule.description && (
                <Text category="s1" appearance="hint" style={styles.description}>
                    {rule.description}
                </Text>
            )}

            {/* Logic container commented out
            <View style={styles.logicContainer}>
                <Text category="label" style={styles.logicLabel}>
                    Lógica JSON:
                </Text>
                <View style={styles.logicBox}>
                    <Text category="c1" style={styles.logicText}>
                        {renderJsonLogic(rule.json_logic)}
                    </Text>
                </View>
            </View>
            */}

            <View style={styles.footer}>
                <Text category="c2" appearance="hint">
                    Actualizado: {new Date(rule.updated_at).toLocaleDateString('es-ES')}
                </Text>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: LayoutConstants.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: LayoutConstants.spacing.xs,
    },
    title: {
        flex: 1,
    },
    inactiveBadge: {
        backgroundColor: '#FF3D71',
        paddingHorizontal: LayoutConstants.spacing.xs,
        paddingVertical: 2,
        borderRadius: LayoutConstants.borderRadius.sm,
    },
    inactiveText: {
        color: 'white',
    },
    description: {
        marginBottom: LayoutConstants.spacing.sm,
    },
    logicContainer: {
        marginTop: LayoutConstants.spacing.sm,
    },
    logicLabel: {
        marginBottom: LayoutConstants.spacing.xs,
    },
    logicBox: {
        backgroundColor: '#F7F9FC',
        padding: LayoutConstants.spacing.sm,
        borderRadius: LayoutConstants.borderRadius.sm,
        borderWidth: 1,
        borderColor: '#E4E9F2',
    },
    logicText: {
        fontFamily: 'monospace',
        fontSize: 11,
    },
    footer: {
        marginTop: LayoutConstants.spacing.sm,
        paddingTop: LayoutConstants.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#E4E9F2',
    },
});
