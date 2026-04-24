import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';
import { settings } from '@/config/settings';

const log = logger.withTag('NETWORK_UTILS');

/**
 * Fetches NetInfo state with a workaround for the "unknown" type bug.
 * On first fetch, NetInfo may return type: "unknown" which is incorrect.
 * This function refreshes and retries if that happens.
 * 
 * @see https://github.com/react-native-netinfo/react-native-netinfo/issues/781
 */
async function fetchNetInfoWithRetry(): Promise<ReturnType<typeof NetInfo.fetch>> {
    let state = await NetInfo.fetch();
    
    // Workaround for Issue #781: NetInfo returns type: "unknown" on first fetch
    // This happens on Android emulators and some devices
    if (state.type === 'unknown') {
        log.debug('NetInfo returned "unknown", refreshing...');
        await NetInfo.refresh();
        state = await NetInfo.fetch();
        log.debug('NetInfo after refresh:', { type: state.type, isConnected: state.isConnected });
    }
    
    return state;
}

/**
 * Checks if the backend server is reachable.
 * This is more robust than NetInfo.isInternetReachable for local development
 * because it attempts a real connection to the configured API base URL.
 * 
 * @param timeoutOverride Optional timeout in ms (default: FAST from settings)
 */
export async function isServerReachable(timeoutOverride?: number): Promise<boolean> {
    try {
        const state = await fetchNetInfoWithRetry();

        // If there's no basic connection, don't even try
        if (!state.isConnected) {
            log.debug('No network connection detected');
            return false;
        }

        // In development, isInternetReachable often fails for local servers.
        // We perform a lightweight "ping" to our own backend.
        const timeout = timeoutOverride ?? settings.api.timeoutProfiles.FAST;
        log.debug(`Checking server reachability (timeout: ${timeout}ms)...`);

        // We use native fetch to avoid circular dependencies with apiClient
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(settings.api.baseUrl + '/', {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // SSOT CONNECTIVITY POLICY:
            // Si el servidor responde (cualquier status), se considera ALCANZABLE.
            // Esto es vital para que AuthRepository intente el login online y,
            // si recibe un 500, bloquee el fallback offline según política de seguridad.
            const isReachable = response.status > 0 && response.status < 600;
            log.debug(`Server reachability result: ${isReachable} (Status: ${response.status})`);
            return isReachable;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            log.debug('Server ping fetch failed or timed out', fetchError);
            return false;
        }
    } catch (error) {
        log.debug('Server reachability check failed', error);
        return false;
    }
}
