import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Spinner, Layout, Button, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { AlertCircle, Info, ArrowLeft } from 'lucide-react-native';
import { match } from 'ts-pattern';

import { RewardsProvider, useRewardsStore, useRewardsDispatch } from '../core/store';
import { FETCH_ALL_DATA_REQUESTED, GO_BACK_CLICKED } from '../core/types';
import LayoutConstants from '@/constants/layout';
import Colors from '@/constants/colors';
import { WinningRecord } from '@/types';

// --- Subcomponents ---
import { HeroSection } from './components/HeroSection';
import { WinningCategories } from './components/WinningCategories';
import { UserWinningsSection } from './components/UserWinningsSection';

// --- Types ---

interface RewardScreenProps {
    drawId: string;
    title?: string;
    defaultCommissionRate?: number;
}

type AppTheme = typeof Colors.light;

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
            icon={(props: any) => (
                <View style={props?.style}>
                    <ArrowLeft size={24} color={theme.text} />
                </View>
            )}
            onPress={handleBack}
        />
    );

    const rewardsStatus = model.rewards.status;
    const winningsStatus = model.userWinnings.status;

    // Estado global de carga (para el RefreshControl)
    const isGlobalLoading = rewardsStatus.type === 'Loading' || winningsStatus.type === 'Loading';

    const renderMainContent = (winningData: WinningRecord | null) => {
        if (!winningData) {
            return (
                <Layout style={styles.centerContainer}>
                    <View style={styles.iconCircle}>
                        <Info size={40} color={theme.primary} />
                    </View>
                    <Text category="h5" style={styles.emptyText}>Resultados Pendientes</Text>
                    <Text appearance="hint" style={styles.emptySubtext}>
                        Este sorteo aún no ha sido premiado. Por favor, vuelve a intentarlo más tarde o pulsa el botón para actualizar.
                    </Text>
                    <Button 
                        status="primary" 
                        size="large"
                        onPress={handleRefresh} 
                        style={styles.refreshButton}
                        accessoryLeft={(props) => <Info {...props} size={20} />}
                    >
                        Actualizar Ahora
                    </Button>
                </Layout>
            );
        }

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
                <HeroSection winningNumber={winningData.winning_number} />
                <WinningCategories winningNumber={winningData.winning_number} />
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
        <Layout style={{ flex: 1 }}>
            <View style={{ paddingTop: insets.top, backgroundColor: theme.background }}>
                <TopNavigation 
                    title={model.drawTitle || "Premios del Sorteo"} 
                    alignment="center"
                    accessoryLeft={renderBackAction}
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
    loadingText: {
        marginTop: 16,
    },
    errorText: {
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyText: {
        marginTop: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(51, 102, 255, 0.1)', // Sutil azul basado en theme.primary
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    refreshButton: {
        marginTop: 32,
        borderRadius: 12,
        paddingHorizontal: 24,
    },
});

export default RewardScreen;
