import React from 'react';
import { 
    StyleSheet, 
    ScrollView, 
    RefreshControl,
    View,
} from 'react-native';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/shallow';
import { RemoteData } from '@core/tea-utils';
import { Label } from '@/shared/components';
import Header from '../views/header';
import { useDashboardStore, useListeroDashboardStoreApi } from '../store';
import { REFRESH_CLICKED, PROMOTION_MSG } from '../core/msg';
import { CLOSE_PROMOTIONS_MODAL, PARTICIPATE_CLICKED } from '../../../../shared/components/promotion/msg';
import { Slot } from '@core/plugins';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardLifecycle } from '../core/lifecycle';
import { PromotionModal } from '../../../../shared/components/promotion/PromotionModal';
import { pipe as $ } from 'fp-ts/lib/function';
$()
export default function DashboardScreen() {
    
    // Using useShallow to only re-render if the model properties actually change.
    // This helps avoid re-renders from the 1s TICK if those specific fields don't change.
    const model = useDashboardStore(useShallow((state) => state.model));
    const dispatch = useDashboardStore((state) => state.dispatch);

    // Manage Dashboard Lifecycle (Initialization & Cleanup)
    // Pass the actual store API (Zustand store) to lifecycle
    const storeApi = useListeroDashboardStoreApi();
    useDashboardLifecycle(storeApi);

    return (
        <SafeAreaView style={styles.container}>
            <Header onRefresh={() => dispatch(REFRESH_CLICKED())} />
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[1]}
                refreshControl={
                    <RefreshControl
                        refreshing={RemoteData.isLoading(model.draws)}
                        onRefresh={() => dispatch(REFRESH_CLICKED())}
                        colors={['#00C48C']} // Android
                        tintColor="#00C48C" // iOS
                    />
                }
            >
                {/* Global Error Banners could also be plugins, but kept here for now as shell concerns */}
                {match(model.draws)
                    .with(RemoteData.Failure, ({ error }) => (
                        <View style={styles.errorBanner}>
                            <Label style={styles.errorText}>Error al cargar sorteos: {error?.message || String(error)}</Label>
                        </View>
                    ))
                    .otherwise(() => null)}

                {model.isRateLimited && (
                    <View style={styles.warningBanner}>
                        <Label style={styles.warningText}>
                            Modo de espera: Mostrando datos locales debido a saturación del servidor.
                        </Label>
                    </View>
                )}

                <Slot 
                    name="dashboard.notifications" 
                    contextData={model} 
                    hostStore={storeApi}
                />

                <Slot 
                    name="dashboard.filters" 
                    contextData={model} 
                    hostStore={storeApi}
                />
                
                {model.userStructureId ? (
                    <Slot 
                        name="dashboard.summary" 
                        contextData={model} 
                        hostStore={storeApi}
                    />
                ) : null}
                
                <Slot name="dashboard.summary_bottom" />
                
                <Slot 
                    name="dashboard.draws_list" 
                    contextData={model} 
                    hostStore={storeApi}
                />
            </ScrollView>

            <PromotionModal 
                isVisible={model.promotion.showPromotionsModal}
                promotions={model.promotion.promotions}
                onClose={() => dispatch(PROMOTION_MSG(CLOSE_PROMOTIONS_MODAL()))}
                onParticipate={(promotion) => {
                    const activeDraws = RemoteData.withDefault([], model.draws);
                    dispatch(PROMOTION_MSG(PARTICIPATE_CLICKED(promotion, activeDraws)));
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        paddingBottom: 20,
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
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
        textAlign: 'center',
    },
    warningBanner: {
        backgroundColor: '#fff3cd',
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    warningText: {
        color: '#856404',
        fontSize: 14,
        textAlign: 'center',
    },
});