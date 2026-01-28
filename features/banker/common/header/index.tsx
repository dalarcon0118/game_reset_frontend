import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Flex, Label } from '@shared/components';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@shared/hooks/use_theme';

interface ListeroHeaderProps {
    title?: string;
    onBack: () => void;
    onRefresh: () => void;
    loading?: boolean;
}

export const Header: React.FC<ListeroHeaderProps> = ({
    title,
    onBack,
    onRefresh,
    loading = false
}) => {
    const { colors, spacing } = useTheme();

    return (
        <Flex align="center" justify="between" style={[styles.header, { padding: spacing.lg, borderColor: colors.border }]}>
            <Flex align="center" gap={spacing.md}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Flex>
                    <Label type="title" value={`${title || ''}`} />
                </Flex>
            </Flex>
            <TouchableOpacity onPress={onRefresh} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <RefreshCw size={24} color={colors.primary} />
                )}
            </TouchableOpacity>
        </Flex>
    );
};

const styles = StyleSheet.create({
    header: {
        borderBottomWidth: 1,
    },
});
