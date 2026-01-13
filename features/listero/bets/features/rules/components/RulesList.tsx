import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Spinner } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Trophy, FileText, RefreshCw } from 'lucide-react-native';
import { useRules } from '../useRules';
import { RemoteData } from '@/shared/core/remote.data';
import RuleItem from '../../../screens/RuleItem';
import LayoutConstants from '@/constants/Layout';
import { useBetsStore, selectBetsModel } from '../../../core/store';

interface RulesListProps {
    drawId?: string;
}

export const RulesList: React.FC<RulesListProps> = ({ drawId }) => {
    const model = useBetsStore(selectBetsModel);
    const { fetchRules, refreshRules } = useRules();
    const { rulesList, allRules, stats, isRefreshing, currentDrawId } = model.rulesSession;

    // Sincronización del drawId usando useEffect (puente React -> TEA)
    useEffect(() => {
        if (drawId && drawId !== currentDrawId) {
            fetchRules(drawId);
        }
    }, [drawId, currentDrawId, fetchRules]);

    const handleRefresh = useCallback(() => {
        console.log('RulesList: handleRefresh triggered');
        if (drawId) {
            refreshRules(drawId);
        }
    }, [drawId, refreshRules]);

    if (RemoteData.isLoading(rulesList)) {
        return (
            <View style={styles.loadingContainer}>
                <Spinner size="large" />
                <Text style={styles.loadingText}>Cargando reglas...</Text>
            </View>
        );
    }

    if (RemoteData.isFailure(rulesList)) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error al cargar las reglas</Text>
            </View>
        );
    }

    const data = RemoteData.withDefault({ validationRules: [], rewardRules: [], structureName: '', drawName: '' }, rulesList);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { minHeight: '101%' }]}
            alwaysBounceVertical={true}
            refreshControl={
                <RefreshControl
                    refreshing={!!isRefreshing}
                    onRefresh={handleRefresh}
                    colors={['#007AFF']} // Android
                    tintColor="#007AFF" // iOS
                    title="Actualizando reglas..." // iOS
                    titleColor="#007AFF" // iOS
                    progressViewOffset={20}
                />
            }
        >
            {data.drawName !== '' && data.structureName !== '' && (
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <Card style={styles.headerCard}>
                        <View style={styles.headerContent}>
                            <FileText size={24} color="#ffffff" style={styles.headerIcon} />
                            <View style={styles.headerTextContainer}>
                                <Text category="h6" style={styles.headerTitle}>{data.drawName}</Text>
                                <Text category="s1" style={styles.headerSubtitle}>Estructura: {data.structureName}</Text>
                            </View>
                        </View>
                    </Card>
                </LinearGradient>
            )}

            <Card style={styles.statsCard}>
                <Text category="h6" style={styles.statsTitle}>Resumen de Reglas</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={styles.statIconContainer}>
                            <FileText size={20} color="#8F9BB3" />
                        </View>
                        <Text category="s1" style={styles.statNumber}>{stats.total}</Text>
                        <Text category="c2" style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#FFF8E1' }]}>
                            <Shield size={20} color="#FFAA00" />
                        </View>
                        <Text category="s1" style={[styles.statNumber, { color: '#FFAA00' }]}>{stats.validationCount}</Text>
                        <Text category="c2" style={styles.statLabel}>Validación</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#E8F5F0' }]}>
                            <Trophy size={20} color="#00C48C" />
                        </View>
                        <Text category="s1" style={[styles.statNumber, { color: '#00C48C' }]}>{stats.rewardCount}</Text>
                        <Text category="c2" style={styles.statLabel}>Premiación</Text>
                    </View>
                </View>
            </Card>

            <View style={styles.rulesContainer}>
                {allRules.map((rule) => (
                    <RuleItem key={`${rule.type}-${rule.id}`} rule={rule} type={rule.type} />
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: LayoutConstants.spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: LayoutConstants.spacing.lg,
    },
    loadingText: {
        marginTop: LayoutConstants.spacing.md,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        color: '#8F9BB3',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: LayoutConstants.spacing.lg,
    },
    errorText: {
        textAlign: 'center',
        color: '#FF3D71',
        fontSize: 16,
        fontWeight: '500',
    },
    headerGradient: {
        marginHorizontal: LayoutConstants.spacing.md,
        marginTop: LayoutConstants.spacing.md,
        borderRadius: LayoutConstants.borderRadius.md,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerCard: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        margin: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: LayoutConstants.spacing.md,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    headerSubtitle: {
        color: '#ffffff',
        opacity: 0.9,
        fontSize: 14,
        fontWeight: '400',
    },
    statsCard: {
        marginHorizontal: LayoutConstants.spacing.md,
        marginBottom: LayoutConstants.spacing.md,
        padding: LayoutConstants.spacing.md,
        backgroundColor: '#ffffff',
        borderRadius: LayoutConstants.borderRadius.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statsTitle: {
        textAlign: 'center',
        marginBottom: LayoutConstants.spacing.sm,
        fontSize: 16,
        fontWeight: '600',
        color: '#2E3A59',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: LayoutConstants.spacing.sm,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F7F9FC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: LayoutConstants.spacing.xs,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#8F9BB3',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rulesContainer: {
        padding: LayoutConstants.spacing.md,
        paddingTop: 0,
    },
});

export default RulesList;