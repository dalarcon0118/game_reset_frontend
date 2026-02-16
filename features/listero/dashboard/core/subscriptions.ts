import { Sub } from '@/shared/core/sub';
import settings from '@/config/settings';
import { useAuthStore } from '@/features/auth/store/store';
import { pluginEventBus } from '@/shared/core/plugins/plugin.event_bus';
import { globalEventRegistry, EventDescriptor } from '@/shared/core/events';
import {
    AUTH_USER_SYNCED,
    FINANCIAL_UPDATE_RECEIVED,
    SSE_CONNECTED,
    SSE_ERROR,
    NONE,
    STATUS_FILTER_CHANGED,
    REFRESH_CLICKED,
    RULES_CLICKED,
    REWARDS_CLICKED,
    BETS_LIST_CLICKED,
    CREATE_BET_CLICKED,
    Msg
} from './msg';

export const getAuthSub = () => {
    return Sub.watchStore(
        useAuthStore,
        (state: any) => state?.model?.user ?? state?.user,
        (user) => {
            // Always sync user state - let the update logic decide if action is needed
            // The AuthHandler already has logic to prevent duplicate fetches
            return AUTH_USER_SYNCED(user);
        },
        'dashboard-auth-sync'
    );
};

export const getFinancialUpdatesSub = (authToken: string) => {
    // Pass token as query parameter for React Native Android compatibility
    // EventSource polyfill has issues sending headers in RN Android
    const sseUrl = `${settings.api.baseUrl}/financial-statement/stream/?token=${encodeURIComponent(authToken)}`;
    return Sub.sse(
        sseUrl,
        (payload) => {
            if (payload.type === 'FINANCIAL_UPDATE') {
                return FINANCIAL_UPDATE_RECEIVED(payload);
            } else if (payload.type === 'connected') {
                return SSE_CONNECTED();
            } else if (payload.type === 'error') {
                return SSE_ERROR(payload.message || 'Unknown SSE error');
            }

            return NONE();
        },
        `dashboard-sse-${authToken}`
        // Note: Headers removed - token is now in URL for RN Android compatibility
    );
};

const createPluginSub = (eventName: string, msgCreator: (data: any) => Msg, id: string) => {
    const descriptor: EventDescriptor = {
        type: `plugin:${eventName}`,
        platform: 'generic',
        eventName
    };

    if (!globalEventRegistry.getHandler(descriptor)) {
        globalEventRegistry.register(descriptor, {
            subscribe(target: any, handler: (data: any) => void) {
                return target.subscribe(eventName, handler);
            }
        });
    }

    return Sub.watchEvent(descriptor, pluginEventBus, msgCreator, id);
};

export const getDashboardPluginEventsSub = () => {
    return Sub.batch([
        createPluginSub('dashboard:filter_changed', (data) => STATUS_FILTER_CHANGED(data), 'sub-filter-changed'),
        createPluginSub('dashboard:refresh_clicked', () => REFRESH_CLICKED(), 'sub-refresh-clicked'),
        createPluginSub('dashboard:rules_clicked', (data) => RULES_CLICKED(data), 'sub-rules-clicked'),
        createPluginSub('dashboard:rewards_clicked', (data) => REWARDS_CLICKED(data.id, data.title), 'sub-rewards-clicked'),
        createPluginSub('dashboard:bets_list_clicked', (data) => BETS_LIST_CLICKED(data.id, data.title), 'sub-bets-list-clicked'),
        createPluginSub('dashboard:create_bet_clicked', (data) => CREATE_BET_CLICKED(data.id, data.title), 'sub-create-bet-clicked'),
    ]);
};

/**
 * Suscripción que publica cambios del estado del Host para que los plugins se sincronicen.
 * Esto evita el uso de useEffect en las vistas de los plugins.
 */
export const getHostStateSyncSub = () => {
    return Sub.watchStore(
        { getState: () => ({ model: {} }), subscribe: () => () => { } }, // Placeholder, se inyectará el store real
        (state: any) => state.model,
        (model) => {
            pluginEventBus.publish('host:dashboard:updated', model);
            return NONE();
        },
        'host-state-sync'
    );
};