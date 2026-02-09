import { Sub } from '@/shared/core/sub';
import settings from '@/config/settings';
import { useAuthStore } from '@/features/auth/store/store';
import { AUTH_USER_SYNCED, FINANCIAL_UPDATE_RECEIVED, SSE_CONNECTED, SSE_ERROR, NONE } from './msg';

export const getAuthSub = () => {
    return Sub.watchStore(
        useAuthStore,
        (state: any) => state?.model?.user ?? state?.user,
        (user) => AUTH_USER_SYNCED(user),
        'dashboard-auth-sync'
    );
};

export const getFinancialUpdatesSub = (authToken: string) => {
    const sseUrl = `${settings.api.baseUrl}/financial-statement/stream/`;
    return Sub.sse(
        sseUrl,
        (payload) => {
            console.log('Dashboard SSE message received:', payload);

            // Handle different types of SSE messages
            if (payload.type === 'FINANCIAL_UPDATE') {
                return FINANCIAL_UPDATE_RECEIVED(payload);
            } else if (payload.type === 'connected') {
                return SSE_CONNECTED();
            } else if (payload.type === 'error') {
                return SSE_ERROR(payload.message || 'Unknown SSE error');
            }

            // Ignore other message types
            return NONE();
        },
        `dashboard-sse-${authToken}`, // Dynamic ID based on token to force reconnection on change
        { 'Authorization': `Bearer ${authToken}` }
    );
};
