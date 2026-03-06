import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';
import { settings } from '@/config/settings';

const log = logger.withTag('NETWORK_UTILS');

/**
 * Checks if the backend server is reachable.
 * This is more robust than NetInfo.isInternetReachable for local development
 * because it attempts a real connection to the configured API base URL.
 */
export async function isServerReachable(): Promise<boolean> {
    try {
        const state = await NetInfo.fetch();

        // If there's no basic connection, don't even try
        if (!state.isConnected) {
            log.debug('No network connection detected');
            return false;
        }

        // In development, isInternetReachable often fails for local servers.
        // We perform a lightweight "ping" to our own backend.
        log.debug(`Checking server reachability...`);

        // We use native fetch to avoid circular dependencies with apiClient
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), settings.api.timeoutProfiles.FAST);

        const response = await fetch(settings.api.baseUrl + '/', {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // If we get any response, the server is reachable
        log.debug(`Server reachability result: ${response.ok}`);
        return true;
    } catch (error) {
        log.debug('Server ping failed', error);
        return false;
    }
}
