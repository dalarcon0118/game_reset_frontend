import { Sub, SubDescriptor } from '@/shared/core/sub';
import { adaptAuthUser, DashboardUser } from '../core/user.dto';
import settings from '@/config/settings';
import { useAuthStore } from '@/features/auth/store/store';
import { pluginEventBus } from '@/shared/core/plugins/plugin.event_bus';
import { globalEventRegistry, EventDescriptor } from '@/shared/core/events';
import { logger } from '@/shared/utils/logger';
import { FeatureGateway } from '@/shared/core/architecture/interfaces';
import { Model } from '../core/model';
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
} from '../core/msg';

const log = logger.withTag('DASHBOARD_GATEWAY');

export interface DashboardGatewayInterface extends FeatureGateway<Msg, Model> {
    getAuthSubscription(): SubDescriptor<Msg>;
    getFinancialUpdatesSubscription(authToken: string): SubDescriptor<Msg>;
    getDashboardPluginEventsSubscription(): SubDescriptor<Msg>;
    subscriptions(model: Model): SubDescriptor<Msg>;
}

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

// Memoization cache for auth selector
// This prevents infinite loops by returning the *same object reference* 
// when the content hasn't effectively changed, satisfying strict equality checks in the engine.
let _lastAuthUserRef: DashboardUser | null = null;
let _lastAuthUserHash: string = '';

const memoizedAuthSelector = (state: any): DashboardUser | null => {
    // 1. ASTUTE ADAPTER:
    // First, we try to adapt and validate the raw user from the store.
    // If it fails validation, we get null (safe rejection).
    // If it passes, we get a clean DTO.
    const rawUser = state?.model?.user ?? state?.user;

    // Log raw user to debug structure
    if (Math.random() < 0.05) { // Sample logs to avoid flooding
        log.debug('memoizedAuthSelector rawUser check', { hasRawUser: !!rawUser, keys: rawUser ? Object.keys(rawUser) : [] });
    }

    const cleanUser = adaptAuthUser(rawUser);

    // If no valid user, reset cache and return null
    if (!cleanUser) {
        if (_lastAuthUserRef !== null) {
            log.info('memoizedAuthSelector: User logged out or invalid', { rawUserPresent: !!rawUser });
        }
        _lastAuthUserRef = null;
        _lastAuthUserHash = '';
        return null;
    }

    try {
        // 2. STABILITY CHECK (Memoization):
        // Create a hash of the CLEAN DTO.
        // Since the DTO is flat and normalized, JSON.stringify is reliable here.
        const currentHash = JSON.stringify(cleanUser);

        if (currentHash === _lastAuthUserHash && _lastAuthUserRef) {
            // Content is identical, return the OLD reference
            // The engine's strict equality check (old === new) will pass, preventing a dispatch loop.
            return _lastAuthUserRef;
        }

        // Content changed, update cache and return NEW reference
        log.info('memoizedAuthSelector: User Changed', {
            id: cleanUser.id,
            structureId: cleanUser.structureId
        });

        _lastAuthUserHash = currentHash;
        _lastAuthUserRef = cleanUser;
        return cleanUser;
    } catch (e) {
        log.warn('Failed to stringify user object for memoization', e);
        // Fallback: return the clean user directly
        return cleanUser;
    }
};

export const DashboardGateway: DashboardGatewayInterface = {
    receive: (_msg: Msg, _model: Model) => null,

    subscriptions: (model: Model) => {
        const subs: SubDescriptor<Msg>[] = [
            // 1. Auth Sync (Critical)
            DashboardGateway.getAuthSubscription(),

            // 2. Plugin Events
            DashboardGateway.getDashboardPluginEventsSubscription(),
        ];

        // 3. Financial Updates (SSE) - Only if we have a token
        if (model.authToken) {
            subs.push(DashboardGateway.getFinancialUpdatesSubscription(model.authToken));
        }

        return Sub.batch(subs);
    },

    getAuthSubscription: () => {
        return Sub.watchStore(
            useAuthStore,
            memoizedAuthSelector,
            (user: DashboardUser | null) => AUTH_USER_SYNCED(user),
            'dashboard-auth-sync'
        );
    },

    getFinancialUpdatesSubscription: (authToken: string) => {
        return Sub.sse({
            url: `${settings.apiUrl}/financial/updates/stream/`,
            options: {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            },
            onOpen: () => SSE_CONNECTED(),
            onMessage: (event) => {
                try {
                    const data = JSON.parse(event.data);
                    return FINANCIAL_UPDATE_RECEIVED({ update: data });
                } catch (e) {
                    log.error('Failed to parse financial update', e);
                    return NONE();
                }
            },
            onError: (error) => SSE_ERROR({ error: String(error) })
        });
    },

    getDashboardPluginEventsSubscription: () => {
        return Sub.batch([
            createPluginSub('status_filter_changed', (data) => STATUS_FILTER_CHANGED({ filter: data }), 'sub-filter-change'),
            createPluginSub('refresh_clicked', () => REFRESH_CLICKED(), 'sub-refresh-click'),
            createPluginSub('rules_clicked', () => RULES_CLICKED(), 'sub-rules-click'),
            createPluginSub('rewards_clicked', () => REWARDS_CLICKED(), 'sub-rewards-click'),
            createPluginSub('bets_list_clicked', () => BETS_LIST_CLICKED(), 'sub-bets-list-click'),
            createPluginSub('create_bet_clicked', () => CREATE_BET_CLICKED(), 'sub-create-bet-click'),
        ]);
    }
};
