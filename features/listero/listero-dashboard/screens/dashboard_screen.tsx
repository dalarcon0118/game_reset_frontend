import React, { useEffect, useRef } from 'react';
import { 
    StyleSheet, 
    ScrollView, 
    RefreshControl,
    View,
} from 'react-native';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/shallow';
import { RemoteData } from '@/shared/core/tea-utils';
import { Label } from '@/shared/components';
import Header from '../views/header';
import { useDashboardStore } from '../store';
import { REFRESH_CLICKED, AUTH_USER_SYNCED } from '../core/msg';
import { adaptAuthUser } from '../core/user.dto';
import { Slot } from '@/shared/core/plugins';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../auth/hooks/use_auth';
import { useDashboardLifecycle } from '../core/lifecycle';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_SCREEN');

export default function DashboardScreen() {
    const { user } = useAuth();
    const lastSyncedUser = useRef<string | null>(null);
    
    // Using useShallow to only re-render if the model properties actually change.
    // This helps avoid re-renders from the 1s TICK if those specific fields don't change.
    const model = useDashboardStore(useShallow((state) => state.model));
    const dispatch = useDashboardStore((state) => state.dispatch);

    // Manage Dashboard Lifecycle (Initialization & Cleanup)
    useDashboardLifecycle(useDashboardStore);

    // Synchronize auth user state with dashboard store
    // We use a ref and ID check to break any potential infinite re-render loops
    React.useEffect(() => {
        if (user) {
            const adapted = adaptAuthUser(user);
            if (adapted) {
                const userKey = `${adapted.id}-${adapted.structureId}`;
                if (lastSyncedUser.current !== userKey) {
                    log.info('Syncing user with dashboard store', { userKey });
                    lastSyncedUser.current = userKey;
                    dispatch(AUTH_USER_SYNCED(adapted));
                }
            }
        }
    }, [user, dispatch]);

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
                {match(model.summary)
                    .with(RemoteData.Failure, ({ error }) => (
                        <View style={styles.errorBanner}>
                            <Label style={styles.errorText}>Error al cargar resumen: {error?.message || String(error)}</Label>
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
                    hostStore={useDashboardStore}
                />

                <Slot 
                    name="dashboard.filters" 
                    contextData={model} 
                    hostStore={useDashboardStore}
                />
                
                <Slot 
                    name="dashboard.summary" 
                    contextData={model} 
                    hostStore={useDashboardStore}
                />
                <Slot name="dashboard.summary_bottom" />
                
                <Slot 
                    name="dashboard.draws_list" 
                    contextData={model} 
                    hostStore={useDashboardStore}
                />
            </ScrollView>
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