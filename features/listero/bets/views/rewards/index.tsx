import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Spinner, useTheme, Button } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Trophy, Hash, Award, Layers } from 'lucide-react-native';

import { useBets } from '../../hooks/useBets';
import { ApiClientError } from '../../../../../shared/services/ApiClient';

interface RewardsScreenProps {
    drawId: string;
}

export default function RewardsScreen({ drawId }: RewardsScreenProps) {
    const theme = useTheme();
    const { rewards, fetchRewards } = useBets();

    useEffect(() => {
        fetchRewards(drawId);
    }, [drawId, fetchRewards]);

    const winningNumbers = rewards.data;
    const isLoadingNumbers = rewards.isLoading;
    const errorNumbers = rewards.error;

    const winningData = useMemo(() => {
        if (!winningNumbers?.winning_number) return null;

        // Ejemplo: "621 32 86"
        // Normalizar espacios y dividir
        const parts = winningNumbers.winning_number.trim().split(/\s+/);

        if (parts.length === 0) return null;

        const firstNumber = parts[0]; // "621"
        const otherNumbers = parts.slice(1); // ["32", "86"]

        // 1. Centena: Últimos 3 dígitos del primer número
        const centena = firstNumber.length >= 3 ? firstNumber.slice(-3) : firstNumber;

        // 2. Fijo: Últimos 2 dígitos del primer número
        const fijo = firstNumber.length >= 2 ? firstNumber.slice(-2) : firstNumber;

        // 3. Corridos: Los otros números
        const corridos = otherNumbers;

        // 4. Parlets: Combinaciones de pares
        // El fijo se combina con los corridos, y los corridos entre sí
        const allNumbers = [fijo, ...corridos];
        const parlets: string[] = [];

        for (let i = 0; i < allNumbers.length; i++) {
            for (let j = i + 1; j < allNumbers.length; j++) {
                parlets.push(`${allNumbers[i]} - ${allNumbers[j]}`);
            }
        }

        return {
            fullNumber: winningNumbers.winning_number,
            centena,
            fijo,
            corridos,
            parlets
        };
    }, [winningNumbers]);

    if (isLoadingNumbers) {
        return (
            <View style={styles.loadingContainer}>
                <Spinner size="large" />
                <Text style={styles.loadingText}>Cargando premios...</Text>
            </View>
        );
    }

    if (errorNumbers) {
        // Check if it's a 404 error (winning numbers not available yet)
        const is404 = errorNumbers instanceof ApiClientError && errorNumbers.status === 404;

        if (is404) {
            // Show friendly message for missing winning numbers
            return (
                <SafeAreaView style={styles.container} edges={['top']}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Card style={styles.emptyCard} status="warning">
                            <View style={styles.emptyContent}>
                                <Trophy size={48} color={theme['color-warning-500']} />
                                <Text category="h6" style={styles.emptyTitle}>
                                    Números Ganadores Pendientes
                                </Text>
                                <Text appearance="hint" style={styles.emptyText}>
                                    Los números ganadores de este sorteo aún no han sido publicados. Por favor, vuelve más tarde.
                                </Text>
                            </View>
                        </Card>
                    </ScrollView>
                </SafeAreaView>
            );
        }

        // Generic error for other error types
        return (
            <View style={styles.errorContainer}>
                <Text status="danger">Error al cargar los datos del sorteo</Text>
                <Text appearance="hint" style={{ marginTop: 8, textAlign: 'center' }}>
                    {(errorNumbers as any) instanceof ApiClientError
                        ? (errorNumbers as any).data.detail || (errorNumbers as any).message
                        : 'Ha ocurrido un error inesperado'}
                </Text>
                <Button
                    style={styles.backButton}
                    appearance="outline"
                    status="primary"
                    onPress={() => fetchRewards(drawId)}
                >
                    Reintentar
                </Button>
                <Button
                    style={styles.backButton}
                    appearance="ghost"
                    status="basic"
                    onPress={() => router.back()}
                >
                    Volver
                </Button>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                {!winningData ? (
                    <Card style={styles.emptyCard} status="warning">
                        <View style={styles.emptyContent}>
                            <Trophy size={48} color={theme['color-warning-500']} />
                            <Text category="h6" style={styles.emptyTitle}>
                                Sorteo Pendiente
                            </Text>
                            <Text appearance="hint" style={styles.emptyText}>
                                Aún no hay números ganadores registrados para este sorteo.
                            </Text>
                        </View>
                    </Card>
                ) : (
                    <>
                        {/* Número Ganador Principal */}
                        <Card style={styles.mainCard} status="primary">
                            <View style={styles.mainHeader}>
                                <Trophy size={24} color={theme['color-primary-500']} />
                                <Text category="s1" style={styles.cardTitle}>Número Ganador</Text>
                            </View>
                            <Text category="h1" style={styles.winningNumber}>
                                {winningData.fullNumber}
                            </Text>
                            <Text appearance="hint" style={styles.dateText}>
                                {winningNumbers?.date && new Date(winningNumbers.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </Card>

                        {/* Desglose de Premios */}
                        <View style={styles.breakdownContainer}>

                            {/* Fijo y Centena */}
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

                            {/* Corridos */}
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

                            {/* Parlets */}
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
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E9F2',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
    },
    backButton: {
        marginTop: 12,
    },
    emptyCard: {
        marginBottom: 16,
    },
    emptyContent: {
        alignItems: 'center',
        padding: 24,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
    },
    mainCard: {
        marginBottom: 16,
    },
    mainHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        marginLeft: 8,
    },
    winningNumber: {
        textAlign: 'center',
        marginVertical: 8,
        letterSpacing: 2,
    },
    dateText: {
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    breakdownContainer: {
        gap: 16,
    },
    row: {
        flexDirection: 'row',
    },
    statCard: {
        padding: 12,
        alignItems: 'center',
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    sectionCard: {
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        minWidth: 60,
        alignItems: 'center',
    },
    parletGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    parletChip: {
        width: '48%', // 2 columns roughly
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: 'white',
    },
});
