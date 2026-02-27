import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from '@ui-kitten/components';
import { Shield, Trophy, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react-native';
import { UnifiedRule } from '../core/model';
import LayoutConstants from '@/constants/layout';
import Colors from '@/constants/colors';

interface RuleItemProps {
    rule: UnifiedRule;
    type: 'validation' | 'reward';
    onPress?: () => void;
}

export const RuleItem: React.FC<RuleItemProps> = ({ rule, type, onPress }) => {
    const isValidation = type === 'validation';
    const Icon = isValidation ? Shield : Trophy;
    const iconColor = isValidation ? '#FFAA00' : '#00C48C';
    const backgroundColor = isValidation ? '#FFF8E1' : '#E8F5F0';

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <Card style={styles.card} status={isValidation ? 'warning' : 'success'}>
                <View style={styles.container}>
                    <View style={[styles.iconContainer, { backgroundColor }]}>
                        <Icon size={24} color={iconColor} />
                    </View>
                    
                    <View style={styles.contentContainer}>
                        <Text category="s1" style={styles.title} numberOfLines={1}>
                            {rule.name}
                        </Text>
                        <Text category="c1" style={styles.description} numberOfLines={2}>
                            {rule.description}
                        </Text>
                        <View style={styles.metaContainer}>
                            <View style={[
                                styles.badge, 
                                { backgroundColor: rule.is_active ? '#E8F5E9' : '#FFEBEE' }
                            ]}>
                                {rule.is_active ? (
                                    <CheckCircle size={12} color="#2E7D32" />
                                ) : (
                                    <AlertCircle size={12} color="#C62828" />
                                )}
                                <Text category="c2" style={[
                                    styles.badgeText, 
                                    { color: rule.is_active ? '#2E7D32' : '#C62828' }
                                ]}>
                                    {rule.is_active ? 'Activo' : 'Inactivo'}
                                </Text>
                            </View>
                            <Text category="c2" appearance="hint">
                                {new Date(rule.updated_at).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.arrowContainer}>
                        <ChevronRight size={20} color="#8F9BB3" />
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: LayoutConstants.spacing.sm,
        borderWidth: 1,
        borderColor: '#EDF1F7',
        borderRadius: LayoutConstants.borderRadius.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: LayoutConstants.spacing.md,
    },
    contentContainer: {
        flex: 1,
        marginRight: LayoutConstants.spacing.sm,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
        color: '#222B45',
    },
    description: {
        color: '#8F9BB3',
        marginBottom: LayoutConstants.spacing.xs,
        lineHeight: 16,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RuleItem;
