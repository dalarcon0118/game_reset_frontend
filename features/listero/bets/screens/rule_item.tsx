import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from '@ui-kitten/components';
import { Shield, Trophy, AlertTriangle, CheckCircle } from 'lucide-react-native';

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
    const getTypeConfig = () => {
        if (type === 'validation') {
            return {
                label: 'Validación',
                color: '#FFAA00',
                bgColor: '#FFF8E1',
                icon: Shield,
                borderColor: '#FFE082',
            };
        } else {
            return {
                label: 'Premiación',
                color: '#00C48C',
                bgColor: '#E8F5F0',
                icon: Trophy,
                borderColor: '#80CBC4',
            };
        }
    };

    const config = getTypeConfig();
    const IconComponent = config.icon;

    return (
        <Card style={[styles.card, { borderLeftColor: config.borderColor, borderLeftWidth: 4 }]}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <IconComponent size={20} color={config.color} />
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.name}>{rule.name}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
                        <Text style={[styles.typeText, { color: config.color }]}>
                            {config.label}
                        </Text>
                    </View>
                </View>
                <View style={styles.statusContainer}>
                    {rule.is_active ? (
                        <CheckCircle size={16} color="#00C48C" />
                    ) : (
                        <AlertTriangle size={16} color="#FFAA00" />
                    )}
                </View>
            </View>

            <Text style={styles.description}>
                {rule.description}
            </Text>

            {rule.bet_types && rule.bet_types.length > 0 && (
                <View style={styles.betTypesContainer}>
                    <Text style={styles.betTypesLabel}>Tipos de apuesta:</Text>
                    <Text style={styles.betTypes}>
                        {rule.bet_types.join(' • ')}
                    </Text>
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        borderWidth: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
        flex: 1,
        marginRight: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typeText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusContainer: {
        marginLeft: 8,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: '#5C6B8A',
        marginBottom: 8,
    },
    betTypesContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    betTypesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8F9BB3',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    betTypes: {
        fontSize: 13,
        color: '#5C6B8A',
        lineHeight: 18,
    },
});

export default RuleItem;
