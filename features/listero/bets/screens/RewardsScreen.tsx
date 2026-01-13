import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Spinner, useTheme } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Hash, Award, Layers } from 'lucide-react-native';

import { ApiClientError } from '@/shared/services/ApiClient';
import { useBetsStore, selectBetsModel, selectDispatch } from '../core/store';
import { RewardsRulesMsgType } from '../features/rewards-rules/rewards.types';
import { useRewards } from '../features/rewards-rules/useRewards';

interface RewardsScreenProps {
    drawId: string;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ drawId }) => {
    const theme = useTheme();
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { winningNumbers, winningData, isLoading, error, fetchRewards } = useRewards(drawId);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Spinner size="large" />
                <Text style={styles.loadingText}>Cargando premios...</Text>
            </View>
        );
    }

    if (error) {
        const is404 = error instanceof ApiClientError && error.status === 404;
        if (is404) {
            return (
                <SafeAreaView style={styles.container} edges={['top']}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Card style={styles.emptyCard} status="warning">
                            <View style={styles.emptyContent}>
                                <Trophy size={48} color={theme['color-warning-500']} />
                                <Text category="h6" style={styles.emptyTitle}>Números Ganadores Pendientes</Text>
                                <Text appearance="hint" style={styles.emptyText}>Los números ganadores de este sorteo aún no han sido publicados.</Text>
                            </View>
                        </Card>
                    </ScrollView>
                </SafeAreaView>
            );
        }
        return (
            <View style={styles.errorContainer}>
                <Text status="danger">Error al cargar los datos del sorteo</Text>
                <Text appearance="hint" style={{ marginTop: 8, textAlign: 'center' }}>{(error as any).data?.detail || (error as any).message || 'Error inesperado'}</Text>
            </View>
        );
    }

    if (!winningData) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Card style={styles.emptyCard} status="warning">
                        <View style={styles.emptyContent}>
                            <Trophy size={48} color={theme['color-warning-500']} />
                            <Text category="h6" style={styles.emptyTitle}>Sorteo Pendiente</Text>
                            <Text appearance="hint" style={styles.emptyText}>Aún no hay números ganadores registrados para este sorteo.</Text>
                        </View>
                    </Card>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.mainCard} status="primary">
                    <View style={styles.mainHeader}>
                        <Trophy size={24} color={theme['color-primary-500']} />
                        <Text category="s1" style={styles.cardTitle}>Número Ganador</Text>
                    </View>
                    <Text category="h1" style={styles.winningNumber}>{winningData.fullNumber}</Text>
                    <Text appearance="hint" style={styles.dateText}>
                        {winningNumbers?.date && new Date(winningNumbers.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </Card>

                <View style={styles.breakdownContainer}>
                    <View style={styles.row}>
                        <Card style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
                            <View style={styles.statHeader}>
                                <Hash size={16} color={theme['text-hint-color']} />
                                <Text category="c2" appearance="hint">Fijo</Text>
                            </View>
                            <Text category="h3" status="primary">{winningData.fijo}</Text>
                        </Card>
                        <Card style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                            <View style={styles.statHeader}>
                                <Award size={16} color={theme['text-hint-color']} />
                                <Text category="c2" appearance="hint">Centena</Text>
                            </View>
                            <Text category="h3" status="info">{winningData.centena}</Text>
                        </Card>
                    </View>

                    {winningData.corridos.length > 0 && (
                        <Card style={styles.sectionCard}>
                            <Text category="s1" style={styles.sectionTitle}>Corridos</Text>
                            <View style={styles.chipsContainer}>
                                {winningData.corridos.map((num: string, index: number) => (
                                    <View key={index} style={[styles.chip, { backgroundColor: theme['color-success-100'] }]}>
                                        <Text category="h6" status="success">{num}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {winningData.parlets.length > 0 && (
                        <Card style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Layers size={20} color={theme['text-basic-color']} />
                                <Text category="s1" style={styles.sectionTitle}>Parlets (Combinaciones)</Text>
                            </View>
                            <View style={styles.parletGrid}>
                                {winningData.parlets.map((parlet, index) => (
                                    <View key={index} style={[styles.parletChip, { borderColor: theme['color-basic-400'] }]}>
                                        <Text category="s1">{parlet}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
    emptyCard: { marginBottom: 16 },
    emptyContent: { alignItems: 'center', padding: 24 },
    emptyTitle: { marginTop: 16, marginBottom: 8 },
    emptyText: { textAlign: 'center' },
    mainCard: { marginBottom: 16 },
    mainHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    cardTitle: { marginLeft: 8 },
    winningNumber: { textAlign: 'center', marginVertical: 8, letterSpacing: 2 },
    dateText: { textAlign: 'center', textTransform: 'capitalize' },
    breakdownContainer: { gap: 16 },
    row: { flexDirection: 'row' },
    statCard: { padding: 12, alignItems: 'center' },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    sectionCard: { marginTop: 8 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { marginBottom: 12 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, minWidth: 60, alignItems: 'center' },
    parletGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    parletChip: { width: '48%', paddingVertical: 10, borderWidth: 1, borderRadius: 8, alignItems: 'center', backgroundColor: 'white' },
});
