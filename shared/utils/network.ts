import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';
import apiClient from '../services/api_client';

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

        // We use apiClient to make the request, which handles base URL,
        // headers, authentication, and timeout automatically.
        // silentErrors: true suppresses logging for expected failures (server down)
        const response = await apiClient.get<any>('/', {
            silentErrors: true,
            timeoutProfile: 'FAST',
        });

        // If we get here without throwing, the server is reachable
        // Note: apiClient.get() will throw on non-OK responses, but since we used
        // silentErrors, we just need to check if we got a response
        log.debug(`Server reachability result: true`);
        return true;
    } catch (error) {
        // apiClient throws ApiClientError on network failures or non-OK responses
        // If we're here, the server is not reachable
        log.debug('Server ping failed', error);
        return false;
    }
}
