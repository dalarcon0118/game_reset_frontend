import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/shallow';
import { RemoteData } from '@core/tea-utils';
import { Label, ScreenContainer, DashboardSkeleton } from '@/shared/components';
import Header from '../views/header';
import { useDashboardStore, useListeroDashboardStoreApi } from '../store';
import { useNotificationStore, NotificationModule, selectUnreadCount } from '@/features/notification';
import { useWinningStore, useWinningDispatch } from '@/features/listero/winning/core/store';
import { FETCH_PENDING_REWARDS_COUNT } from '@/features/listero/winning/core/types';
import { REFRESH_CLICKED, PROMOTION_MSG, HELP_CLICKED, NOTIFICATIONS_CLICKED, SETTINGS_CLICKED, TOGGLE_BALANCE, SYNC_PRESSED } from '../core/msg';
import { useAuth } from '@/features/auth';
import { CLOSE_PROMOTIONS_MODAL, PARTICIPATE_CLICKED } from '../../../../shared/components/promotion/msg';
import { PromotionModal } from '../../../../shared/components/promotion/PromotionModal';
import { CoreModule } from '@/core/core_module';
import { logger } from '@/shared/utils/logger';
import { useDashboardLifecycle } from '../core/lifecycle';
import { DrawsListView, SummaryView, FiltersView } from '../views/components';

const log = logger.withTag('DASHBOARD_SCREEN');

// ============================================================================
// LOADING VIEW - State-driven loading UI
// ============================================================================

const LoadingView = () => (
  <View style={styles.loadingContainer}>
    <DashboardSkeleton loading={true} />
  </View>
);

// ============================================================================
// HELPERS - Extracción de lógica de renderizado
// ============================================================================

const ErrorBanner = ({ error }: { error: unknown }) => (
    <View style={styles.errorBanner}>
        <Label style={styles.errorText}>Error al cargar sorteos: {error?.message || String(error)}</Label>
    </View>
);

const WarningBanner = () => (
    <View style={styles.warningBanner}>
        <Label style={styles.warningText}>
            Modo de espera: Mostrando datos locales debido a saturación del servidor.
        </Label>
    </View>
);

// ============================================================================
// COMPONENT - Principales
// ============================================================================

export default function DashboardScreen() {
    const model = useDashboardStore(useShallow((s) => s.model));
    const dispatch = useDashboardStore((s) => s.dispatch);
    const { user } = useAuth();
    const isOnline = CoreModule.useStore((s) => s.model.networkConnected);
    const unreadCount = useNotificationStore(useShallow((s) => selectUnreadCount(s.model)));
    const { pendingRewardsCount, pendingRewardsError } = useWinningStore(useShallow((s) => ({
        pendingRewardsCount: s.model.pendingRewardsCount,
        pendingRewardsError: s.model.pendingRewardsError,
    })));
    const storeApi = useListeroDashboardStoreApi();
    const winningDispatch = useWinningDispatch();
    const scrollViewRef = useRef<ScrollView>(null);

    useDashboardLifecycle(storeApi);

    // Expo Router focus effect: Restore focus when screen comes into view
    useFocusEffect(
        useCallback(() => {
            log.info('[FOCUS] Dashboard screen focused');
            // Small delay to ensure UI is fully rendered
            const timer = setTimeout(() => {
                if (model.status.type === 'READY' && scrollViewRef.current) {
                    scrollViewRef.current.scrollTo({ y: 0, animated: false });
                }
            }, 100);
            return () => clearTimeout(timer);
        }, [model.status.type])
    );

    const handleRefresh = () => {
        log.info('[REFRESH] Pull-to-refresh triggered', { 
            userStructureId: model.userStructureId, 
            drawsType: model.draws.type 
        });
        dispatch(REFRESH_CLICKED());
    };

    const handleRetryRewards = () => winningDispatch(FETCH_PENDING_REWARDS_COUNT());

    // Show loading view for non-READY states
    if (model.status.type !== 'READY') {
        return (
            <ScreenContainer edges={['top', 'left', 'right']} backgroundColor="#f5f5f5">
                <Header
                    username={user?.username || 'Usuario'}
                    structureName={user?.structure?.name || 'Mi Estructura'}
                    isOnline={isOnline}
                    showBalance={model.showBalance}
                    unreadCount={unreadCount}
                    rewardsCount={pendingRewardsCount}
                    rewardsError={pendingRewardsError}
                    onRewardsCountPress={handleRetryRewards}
                    onHelpPress={() => dispatch(HELP_CLICKED())}
                    onNotificationPress={() => dispatch(NOTIFICATIONS_CLICKED())}
                    onSettingsPress={() => dispatch(SETTINGS_CLICKED())}
                    onToggleBalance={() => dispatch(TOGGLE_BALANCE())}
                    onSyncPress={() => {
                        dispatch(SYNC_PRESSED());
                        dispatch(REFRESH_CLICKED());
                    }}
                    isSyncing={model.syncStatus === 'syncing'}
                />
                <LoadingView />
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer edges={['top', 'left', 'right']} backgroundColor="#f5f5f5">
    <Header
          username={user?.username || 'Usuario'}
          structureName={user?.structure?.name || 'Mi Estructura'}
          isOnline={isOnline}
          showBalance={model.showBalance}
          unreadCount={unreadCount}
          rewardsCount={pendingRewardsCount}
          rewardsError={pendingRewardsError}
          onRewardsCountPress={handleRetryRewards}
          onHelpPress={() => dispatch(HELP_CLICKED())}
          onNotificationPress={() => dispatch(NOTIFICATIONS_CLICKED())}
          onSettingsPress={() => dispatch(SETTINGS_CLICKED())}
          onToggleBalance={() => dispatch(TOGGLE_BALANCE())}
          onSyncPress={() => {
            dispatch(SYNC_PRESSED());
            dispatch(REFRESH_CLICKED());
          }}
          isSyncing={model.syncStatus === 'syncing'}
        />
            <ContentScrollView 
                scrollRef={scrollViewRef}
                model={model} 
                onRefresh={handleRefresh} 
                showSummary={!!model.userStructureId}
            />
            {/* Only show modal when dashboard is fully ready */}
            {model.status.type === 'READY' && (
                <PromotionModal
                    isVisible={model.promotion.showPromotionsModal}
                    promotions={model.promotion.promotions}
                    onClose={() => dispatch(PROMOTION_MSG(CLOSE_PROMOTIONS_MODAL()))}
                    onParticipate={(promotion) => {
                        const activeDraws = RemoteData.withDefault([], model.draws);
                        dispatch(PROMOTION_MSG(PARTICIPATE_CLICKED(promotion, activeDraws)));
                    }}
                />
            )}
        </ScreenContainer>
    );
}

// ============================================================================
// SUB-COMPONENTS - Extracción para reducir complejidad
// ============================================================================

function ContentScrollView({ 
    model, 
    onRefresh, 
    showSummary,
    scrollRef
}: { 
    model: any; 
    onRefresh: () => void; 
    showSummary: boolean;
    scrollRef?: React.RefObject<ScrollView>;
}) {
    return (
        <ScrollView
            ref={scrollRef}
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            stickyHeaderIndices={[1]}
            refreshControl={
                <RefreshControl
                    refreshing={RemoteData.isLoading(model.draws)}
                    onRefresh={onRefresh}
                    colors={['#00C48C']}
                    tintColor="#00C48C"
                />
            }
        >
            {match(model.draws)
                .with(RemoteData.Failure, ({ error }) => <ErrorBanner error={error} />)
                .otherwise(() => null)}
            
            {model.isRateLimited && <WarningBanner />}
            
            <FiltersView />
            {showSummary && <SummaryView />}
            <DrawsListView />
        </ScrollView>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContent: { paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
  },
  errorBanner: {
        backgroundColor: '#ffebee',
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f44336',
    },
    errorText: { color: '#d32f2f', fontSize: 14, textAlign: 'center' },
    warningBanner: {
        backgroundColor: '#fff3cd',
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    warningText: { color: '#856404', fontSize: 14, textAlign: 'center' },
});
