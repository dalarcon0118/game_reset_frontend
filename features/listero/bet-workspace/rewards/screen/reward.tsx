import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Spinner, Layout, Button } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, AlertCircle, Info } from 'lucide-react-native';
import { useRewards } from '../use_rewards';
import LayoutConstants from '@/constants/layout';
import Colors from '@/constants/colors';
import { useColorScheme } from 'react-native';
import { RemoteData } from '@/shared/core/remote.data';

interface RewardScreenProps {
    drawId: string;
}

export const RewardScreen: React.FC<RewardScreenProps> = ({ drawId }) => {
    const { rewards, fetchRewards } = useRewards();
    const colorScheme = useColorScheme() ?? 'light';
    // @ts-ignore
    const theme = Colors[colorScheme];

    useEffect(() => {
        if (drawId) {
            fetchRewards(drawId);
        }
    }, [drawId]);

    const handleRefresh = () => {
        if (drawId) {
            fetchRewards(drawId);
        }
    };

    const isLoading = RemoteData.isLoading(rewards.status);
    const error = RemoteData.getFailure(rewards.status);
    const winningData = RemoteData.getSuccess(rewards.status);

    if (isLoading && !winningData) {
        return (
            <Layout style={styles.centerContainer}>
                <Spinner size="large" />
                {/* @ts-ignore */}
                <Text category="s1" style={[styles.loadingText, { color: theme.textSecondary }]}>Buscando premios...</Text>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout style={styles.centerContainer}>
                {/* @ts-ignore */}
                <AlertCircle size={48} color={theme.error} />
                {/* @ts-ignore */}
                <Text category="h6" style={[styles.errorText, { color: theme.error }]}>Error al cargar premios</Text>
                <Button status="primary" appearance="ghost" onPress={handleRefresh}>
                    Reintentar
                </Button>
            </Layout>
        );
    }

    if (!winningData) {
        return (
            <Layout style={styles.centerContainer}>
                {/* @ts-ignore */}
                <Info size={48} color={theme.textTertiary} />
                <Text category="h6" style={styles.emptyText}>No hay resultados para este sorteo</Text>
                <Text appearance="hint" style={styles.emptySubtext}>Los resultados se publicarán pronto.</Text>
                <Button status="basic" appearance="outline" onPress={handleRefresh} style={{ marginTop: 20 }}>
                    Actualizar
                </Button>
            </Layout>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
            }
        >
            {/* Hero Section - Winning Number */}
            <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
            >
                <View style={styles.heroContent}>
                    <Trophy size={40} color="#FFFFFF" style={styles.heroIcon} />
                    <Text category="h1" style={styles.heroNumber}>
                        {winningData.fullNumber}
                    </Text>
                    <Text category="s1" style={styles.heroLabel}>
                        NÚMERO GANADOR
                    </Text>
                </View>
            </LinearGradient>

            {/* Main Categories */}
            <View style={styles.categoriesRow}>
                <Card style={styles.categoryCard}>
                    <Text category="c2" appearance="hint" style={styles.categoryLabel}>FIJO</Text>
                    <Text category="h4" style={styles.categoryValue}>{winningData.fixed}</Text>
                </Card>
                <Card style={styles.categoryCard}>
                    <Text category="c2" appearance="hint" style={styles.categoryLabel}>CORRIDO</Text>
                    <Text category="h4" style={styles.categoryValue}>{winningData.running}</Text>
                </Card>
                <Card style={styles.categoryCard}>
                    <Text category="c2" appearance="hint" style={styles.categoryLabel}>CENTENA</Text>
                    <Text category="h4" style={styles.categoryValue}>{winningData.hundred}</Text>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: LayoutConstants.spacing.md,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    heroGradient: {
        borderRadius: LayoutConstants.borderRadius.lg,
        padding: 40,
        marginBottom: LayoutConstants.spacing.lg,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    heroContent: {
        alignItems: 'center',
    },
    heroIcon: {
        marginBottom: 12,
    },
    heroNumber: {
        color: '#FFFFFF',
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroLabel: {
        color: '#FFFFFF',
        letterSpacing: 2,
        fontWeight: '700',
        opacity: 0.9,
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: LayoutConstants.spacing.sm,
        marginBottom: LayoutConstants.spacing.lg,
    },
    categoryCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: LayoutConstants.spacing.md,
    },
    categoryLabel: {
        fontWeight: '700',
        marginBottom: 4,
    },
    categoryValue: {
        fontWeight: '800',
    },
    loadingText: {
        marginTop: 16,
    },
    errorText: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        textAlign: 'center',
        marginTop: 4,
    },
});

export default RewardScreen;
