import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';
import { settings } from '@/config/settings';

const log = logger.withTag('NETWORK_UTILS');

/**
 * Checks if the backend server is reachable.
 * This is more robust than NetInfo.isInternetReachable for local development
 * because it attempts a real connection to the configured API base URL.
 * 
 * @param timeoutOverride Optional timeout in ms (default: FAST from settings)
 */
export async function isServerReachable(timeoutOverride?: number): Promise<boolean> {
    try {
        const state = await NetInfo.fetch();

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
