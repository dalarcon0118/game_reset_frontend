import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Spinner, Layout, Button, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { AlertCircle, Info, ArrowLeft, ChevronDown } from 'lucide-react-native';
import { match } from 'ts-pattern';

import { RewardsProvider, useRewardsStore, useRewardsDispatch } from '../core/store';
import { FETCH_ALL_DATA_REQUESTED, GO_BACK_CLICKED } from '../core/types';
import { mapBetTypesToPrizeCards } from '../core/mappers';
import Colors from '@/constants/colors';
import { WinningRecord } from '@/types';

// --- Subcomponents ---
import { UserWinningsSection } from './components/UserWinningsSection';
import { PrizeTableCard } from './components/PrizeTableCard';

// --- Types ---

interface RewardScreenProps {
    drawId: string;
    title?: string;
    defaultCommissionRate?: number;
}

type AppTheme = typeof Colors.light;

/**
 * 📱 SELECTION BAR COMPONENT
 * Implementa la barra de selección con el botón azul y el dropdown.
 */
const SelectionBar: React.FC = () => {
    return (
        <View style={styles.selectionBar}>
            <View style={styles.selectedPill}>
                <Text style={styles.selectedPillText}>CUATERNA</Text>
            </View>
            <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>Lotería 5 Dígitos</Text>
                <ChevronDown size={22} color="#444" />
            </View>
        </View>
    );
};

/**
 * 📱 REWARD SCREEN CONTENT
 * Vista pura que consume el estado del Store de Rewards.
 */
const RewardScreenContent: React.FC<{ drawId: string }> = ({ drawId }) => {
    const { model } = useRewardsStore();
    const dispatch = useRewardsDispatch();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme] as AppTheme;
    const insets = useSafeAreaInsets();

    const handleRefresh = () => {
        if (drawId) {
            dispatch(FETCH_ALL_DATA_REQUESTED({ drawId }));
        }
    };

    const handleBack = () => {
        dispatch(GO_BACK_CLICKED());
    };

    const renderBackAction = () => (
        <TopNavigationAction
            icon={() => <ArrowLeft size={24} color="#000" />}
            onPress={handleBack}
        />
    );

    const rewardsStatus = model.rewards.status;
    const betTypesStatus = model.betTypes.status;
    const winningsStatus = model.userWinnings.status;

    // Estado global de carga (para el RefreshControl)
    const isGlobalLoading = 
        rewardsStatus.type === 'Loading' || 
        betTypesStatus.type === 'Loading' || 
        winningsStatus.type === 'Loading';

    /**
     * 🎯 CONTENIDO PRINCIPAL CON DATOS REALES DEL BACKEND
     * Ahora usa mapBetTypesToPrizeCards para convertir BetType[] a PrizeTableCardProps[]
     */
    const renderMainContent = (winningData: WinningRecord | null) => {
        if (!winningData) {
            return (
                <Layout style={styles.centerContainer}>
                    <View style={styles.iconCircle}>
                        <Info size={40} color={theme.primary} />
                    </View>
                    <Text category="h5" style={styles.emptyText}>Resultados Pendientes</Text>
                    <Text appearance="hint" style={styles.emptySubtext}>
                        Este sorteo aún no ha sido premiados. Por favor, vuelve a intentarlo más tarde o pulsa el botón para actualizar.
                    </Text>
                    <Button 
                        status="primary" 
                        size="large"
                        onPress={handleRefresh} 
                        style={styles.refreshButton}
                        accessoryLeft={() => <Info size={20} color="#FFF" />}
                    >
                        Actualizar Ahora
                    </Button>
                </Layout>
            );
        }

        // 🔄 MAPEAR DATOS DEL BACKEND A PROPS DE COMPONENTE
        // betTypesStatus contiene los BetType con rewards del backend
        const prizeCards = match(betTypesStatus)
            .with({ type: 'Success' }, ({ data }) => mapBetTypesToPrizeCards(data))
            .otherwise(() => []);

        const isBetTypesLoading = betTypesStatus.type === 'Loading';

        return (
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl 
                        refreshing={isGlobalLoading} 
                        onRefresh={handleRefresh}
                        tintColor={theme.primary}
                    />
                }
            >
                <View style={styles.subHeader}>
                    <View style={styles.titleRow}>
                        <Text category="h4" style={styles.mainTitle}>Lotería Diaria (5 Dígitos)</Text>
                        <View style={styles.tagLabel}>
                            <Text style={styles.tagLabelText}>(LS_WEEKLY)</Text>
                        </View>
                    </View>
                    <SelectionBar />
                </View>
                
                <View style={styles.prizesList}>
                    {isBetTypesLoading ? (
                        <View style={styles.loadingPrizes}>
                            <Spinner size="medium" />
                            <Text appearance="hint" style={styles.loadingText}>Cargando premios...</Text>
                        </View>
                    ) : prizeCards.length > 0 ? (
                        prizeCards.map((prize, index) => (
                            <PrizeTableCard key={`${prize.title}-${index}`} {...prize} />
                        ))
                    ) : (
                        <View style={styles.emptyPrizes}>
                            <Text appearance="hint">No hay información de premios disponible</Text>
                        </View>
                    )}
                </View>
                
                <UserWinningsSection status={winningsStatus} />
            </ScrollView>
        );
    };

    const renderContent = () => {
        return match(rewardsStatus)
            .with({ type: 'NotAsked' }, () => (
                <Layout style={styles.centerContainer}>
                    <Spinner size="large" />
                    <Text category="s1" style={[styles.loadingText, { color: theme.textSecondary }]}>Inicializando...</Text>
                </Layout>
            ))
            .with({ type: 'Loading' }, () => (
                <Layout style={styles.centerContainer}>
                    <Spinner size="large" />
                    <Text category="s1" style={[styles.loadingText, { color: theme.textSecondary }]}>Buscando premios...</Text>
                </Layout>
            ))
            .with({ type: 'Failure' }, ({ error }) => (
                <Layout style={styles.centerContainer} testID="rewards-error-state">
                    <AlertCircle size={48} color={theme.error} />
                    <Text category="h6" style={[styles.errorText, { color: theme.error }]}>Error al cargar premios</Text>
                    <Button 
                        status="primary" 
                        appearance="ghost" 
                        onPress={handleRefresh}
                        testID="retry-button"
                    >
                        Reintentar
                    </Button>
                    <Text appearance="hint" style={{ marginTop: 8, fontSize: 12 }}>
                        {typeof error === 'string' ? error : 'Error desconocido'}
                    </Text>
                </Layout>
            ))
            .with({ type: 'Success' }, ({ data }) => renderMainContent(data))
            .otherwise(() => (
                <Layout style={styles.centerContainer}>
                    <Info size={48} color={theme.textTertiary} />
                    <Text category="h6" style={styles.emptyText}>Estado desconocido</Text>
                    <Button status="basic" appearance="outline" onPress={handleRefresh} style={{ marginTop: 20 }}>
                        Actualizar
                    </Button>
                </Layout>
            ));
    };

    return (
        <Layout style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
            <View style={{ paddingTop: insets.top, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                <TopNavigation 
                    title={() => (
                        <Text category="h4" style={{ fontWeight: '800', color: '#000' }}>Tabla de Premios</Text>
                    )}
                    alignment="start"
                    accessoryLeft={renderBackAction}
                    style={{ paddingHorizontal: 16, height: 60 }}
                />
            </View>
            {renderContent()}
        </Layout>
    );
};

/**
 * 🏗️ REWARD SCREEN (Root)
 * Componente que provee el contexto de RewardsModule.
 */
export const RewardScreen: React.FC<RewardScreenProps> = ({ drawId, title, defaultCommissionRate }) => {
    return (
        <RewardsProvider initialParams={{ drawId, title, defaultCommissionRate }}>
            <RewardScreenContent drawId={drawId} />
        </RewardsProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        paddingBottom: 40,
    },
    subHeader: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    mainTitle: {
        fontWeight: '900',
        fontSize: 28,
        color: '#000000',
    },
    tagLabel: {
        marginLeft: 12,
        backgroundColor: '#E8E8E8',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagLabelText: {
        fontSize: 14,
        color: '#777',
        fontWeight: '700',
    },
    selectionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectedPill: {
        backgroundColor: '#0066CC',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 40,
    },
    selectedPillText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
    },
    dropdown: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#E8E8E8',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#FFF',
    },
    dropdownText: {
        fontSize: 17,
        color: '#000',
        fontWeight: '600',
    },
    prizesList: {
        paddingTop: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        marginTop: 16,
        fontWeight: 'bold',
    },
    emptySubtext: {
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    refreshButton: {
        width: '100%',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(51, 102, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    loadingPrizes: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
    },
    errorText: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyPrizes: {
        padding: 40,
        alignItems: 'center',
    },
});

export default RewardScreen;
