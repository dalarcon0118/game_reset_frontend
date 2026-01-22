import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { match } from 'ts-pattern';
import { Label, Flex } from '@/shared/components';
import { useAuth } from '@/features/auth';
import { useDashboardStore } from '../core/store';
import { 
    FETCH_DATA_REQUESTED, 
    STATUS_FILTER_CHANGED, 
    REFRESH_CLICKED,
    RULES_CLICKED,
    REWARDS_CLICKED,
    BETS_LIST_CLICKED,
    CREATE_BET_CLICKED,
    SET_USER_STRUCTURE
} from '../core/msg';
import Header from '../views/Header';
import GlobalSummary from '../views/GlobalSummary';
import DrawItem from '../views/DrawItem';
import { StatusFilter } from '../core/core.types';

export default function DashboardScreen() {
    const { user } = useAuth();
    
    // Using granular selectors for better performance and stability
    const draws = useDashboardStore((state) => state.model.draws);
    const summary = useDashboardStore((state) => state.model.summary);
    const dailyTotals = useDashboardStore((state) => state.model.dailyTotals);
    const statusFilter = useDashboardStore((state) => state.model.statusFilter);
    const commissionRate = useDashboardStore((state) => state.model.commissionRate);
    const filteredDraws = useDashboardStore((state) => state.model.filteredDraws);
    const userStructureId = useDashboardStore((state) => state.model.userStructureId);
    const dispatch = useDashboardStore((state) => state.dispatch);

    // Debugging current state
    console.log('DashboardScreen Render:', {
        draws: draws.type,
        summary: summary.type,
        filteredDraws: filteredDraws.length,
        userStructureId
    });

    useEffect(() => {
        console.log('DashboardScreen: Mounting');
        useDashboardStore.getState().init();
    }, []);

    // Effect for requesting data when structure is detected
    useEffect(() => {
        const structureId = user?.structure?.id?.toString();
        if (structureId && structureId !== userStructureId) {
            console.log('DashboardScreen: New structure detected, requesting data', structureId);
            dispatch(FETCH_DATA_REQUESTED(structureId));
        }
    }, [user?.structure?.id, userStructureId]);

    const filterOptions: { label: string; value: StatusFilter }[] = [
        { label: 'Abierto', value: 'open' },
        { label: 'Cerrado', value: 'closed' },
        { label: 'Premiados', value: 'rewarded' },
        { label: 'Todos', value: 'all' }
    ];

    const renderFilterOptions = () => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filtersContainer}
        >
            {filterOptions.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    onPress={() => dispatch(STATUS_FILTER_CHANGED(option.value))}
                    style={[
                        styles.filterTab,
                        statusFilter === option.value && styles.activeFilterTab
                    ]}
                >
                    <Label 
                        style={[
                            styles.filterLabel,
                            statusFilter === option.value && styles.activeFilterLabel
                        ]}
                    >
                        {option.label}
                    </Label>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header onRefresh={() => dispatch(REFRESH_CLICKED())} />
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[1]}
            >
                {match(summary)
                    .with({ type: 'Failure' }, ({ error }) => (
                        <View style={styles.errorBanner}>
                            <Label style={styles.errorText}>Error al cargar resumen: {error?.message || String(error)}</Label>
                        </View>
                    ))
                    .otherwise(() => null)}

                <GlobalSummary totals={dailyTotals} commissionRate={commissionRate} />
                
                <Flex style={styles.filtersWrapper}>
                    {renderFilterOptions()}
                </Flex>

                <View style={styles.content}>
                    <Flex justify="between" align="center" style={styles.sectionHeader}>
                        <Label style={styles.sectionTitle}>Sorteos</Label>
                        <Label type="detail" style={styles.drawCount}>
                            {match(draws)
                                .with({ type: 'Success' }, ({ data }) => `${data.length} disponibles`)
                                .otherwise(() => 'Cargando...')}
                        </Label>
                    </Flex>

                    {match(draws)
                        .with({ type: 'NotAsked' }, () => null)
                        .with({ type: 'Loading' }, () => {
                            console.log('DashboardScreen: Rendering Loading state', { 
                                draws: draws.type, 
                                summary: summary.type 
                            });
                            return (
                                <View style={styles.centerContainer}>
                                    <ActivityIndicator size="large" color="#00C48C" />
                                    <Label style={styles.loadingText}>Cargando sorteos...</Label>
                                </View>
                            );
                        })
                        .with({ type: 'Failure' }, ({ error }) => (
                            <View style={styles.centerContainer}>
                                <Label style={styles.errorText}>Error al cargar sorteos</Label>
                                <Label type="detail">{error?.message || String(error)}</Label>
                                <TouchableOpacity 
                                    style={styles.retryButton}
                                    onPress={() => dispatch(REFRESH_CLICKED())}
                                >
                                    <Label style={styles.retryText}>Reintentar</Label>
                                </TouchableOpacity>
                            </View>
                        ))
                        .with({ type: 'Success' }, () => (
                            <View>
                                {filteredDraws.length > 0 ? (
                                    filteredDraws.map((draw, index) => (
                                        <DrawItem 
                                            key={draw.id} 
                                            draw={draw} 
                                            index={index}
                                            onPress={(id) => dispatch(CREATE_BET_CLICKED(id, draw.name))}
                                            onRewardsPress={(id, title) => dispatch(REWARDS_CLICKED(id, title))}
                                            onBetsListPress={(id, title) => dispatch(BETS_LIST_CLICKED(id, title))}
                                            onCreateBetPress={(id, title) => dispatch(CREATE_BET_CLICKED(id, title))}
                                        />
                                    ))
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Label style={styles.emptyText}>No hay sorteos para este filtro</Label>
                                    </View>
                                )}
                            </View>
                        ))
                        .exhaustive()}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    errorBanner: {
        backgroundColor: '#FFE2E5',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    filtersWrapper: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E9F2',
    },
    filtersContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 12,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F7F9FC',
        borderWidth: 1,
        borderColor: '#E4E9F2',
    },
    activeFilterTab: {
        backgroundColor: '#00C48C',
        borderColor: '#00C48C',
    },
    filterLabel: {
        fontSize: 13,
        color: '#8F9BB3',
        fontWeight: '600',
    },
    activeFilterLabel: {
        color: '#FFF',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E3A59',
    },
    drawCount: {
        fontSize: 12,
        color: '#8F9BB3',
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8F9BB3',
        fontSize: 14,
    },
    loadingText: {
        marginTop: 12,
        color: '#8F9BB3',
    },
    errorText: {
        color: '#FF3B30',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#00C48C',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '600',
    }
});
