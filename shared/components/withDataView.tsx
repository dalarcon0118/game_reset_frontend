import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Flex } from './flex';
import { Label } from './label';
import { ButtonKit } from './button';
import { useTheme } from '@shared/hooks/useTheme';

interface DataViewProps {
    loading: boolean;
    error: any;
    isEmpty: boolean;
    onRetry: () => void;
    emptyMessage?: string;
    errorMessage?: string;
}

/**
 * Higher-Order Component to handle Loading, Error, and Empty states for data-driven components.
 */
export function withDataView<P extends object>(
    WrappedComponent: React.ComponentType<P>
) {
    return function WithDataViewComponent(props: P & DataViewProps) {
        const { loading, error, isEmpty, onRetry, emptyMessage, errorMessage, ...rest } = props;
        const { colors, spacing } = useTheme();

        if (loading && isEmpty) {
            return (
                <Flex flex={1} justify="center" align="center" style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </Flex>
            );
        }

        if (error) {
            return (
                <Flex flex={1} justify="center" align="center" style={styles.centerContainer}>
                    <Label type="error" value={errorMessage || "Error al cargar los datos"} />
                    <ButtonKit
                        label="Reintentar"
                        onPress={onRetry}
                        style={{ marginTop: spacing.md }}
                        size="small"
                    />
                </Flex>
            );
        }

        if (isEmpty && !loading) {
            return (
                <Flex flex={1} justify="center" align="center" style={styles.centerContainer}>
                    <Label type="detail" value={emptyMessage || "No hay datos para mostrar."} />
                </Flex>
            );
        }

        return <WrappedComponent {...(rest as P)} />;
    };
}

const styles = StyleSheet.create({
    centerContainer: {
        padding: 40,
        minHeight: 200,
    },
});
