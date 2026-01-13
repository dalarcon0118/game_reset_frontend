import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from '@ui-kitten/components';

interface RuleItemProps {
    rule: {
        id: string;
        name: string;
        description: string;
        is_active: boolean;
        bet_types?: string[];
        created_at?: string;
        updated_at?: string;
    };
    type: 'validation' | 'reward';
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, type }) => {
    const getTypeLabel = () => {
        return type === 'validation' ? 'Validación' : 'Premiación';
    };

    const getTypeColor = () => {
        return type === 'validation' ? '#FFAA00' : '#00C48C';
    };

    return (
        <Card style={styles.card} status={rule.is_active ? 'success' : 'warning'}>
            <View style={styles.header}>
                <Text style={styles.name}>{rule.name}</Text>
                <View style={[styles.badge, { backgroundColor: getTypeColor() + '20' }]}>
                    <Text style={[styles.badgeText, { color: getTypeColor() }]}>
                        {getTypeLabel()}
                    </Text>
                </View>
            </View>
            <Text style={styles.description} appearance="hint">
                {rule.description}
            </Text>
            {rule.bet_types && rule.bet_types.length > 0 && (
                <Text style={styles.betTypes} appearance="hint">
                    Tipos: {rule.bet_types.join(', ')}
                </Text>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        marginBottom: 4,
    },
    betTypes: {
        fontSize: 12,
        marginTop: 4,
    },
});

export default RuleItem;
