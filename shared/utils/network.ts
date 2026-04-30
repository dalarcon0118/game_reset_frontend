import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';
import { settings } from '@/config/settings';
import { BET_VALUES } from '@/shared/repositories/bet/bet.constants';

const log = logger.withTag('NETWORK_UTILS');

async function fetchNetInfoWithRetry(): Promise<ReturnType<typeof NetInfo.fetch>> {
  let state = await NetInfo.fetch();

  if (state.type === 'unknown') {
    log.debug('NetInfo returned "unknown", refreshing...');
    await NetInfo.refresh();
    state = await NetInfo.fetch();
    log.debug('NetInfo after refresh:', { type: state.type, isConnected: state.isConnected });
  }

  return state;
}

/**
 * Resolves an adaptive timeout for online API fetches based on network quality.
 *
 * DESIGN (ARCH_DEEP_THINK):
 * - Responsibility: The CALLER (feature layer) decides how long to wait, not the flow.
 * - Mechanism: NetInfo detects network type; the timeout scales accordingly.
 * - Boundary: This function lives in the infrastructure/utils layer (where NetInfo
 *   is already imported), not in the business flow or the TEA handler.
 *
 * @param baseMs Baseline timeout when network type is unknown (default: BET_VALUES.ONLINE_FETCH_TIMEOUT_MS)
 * @returns Timeout in ms calibrated to current network conditions
 */
export async function resolveOnlineTimeout(baseMs: number = BET_VALUES.ONLINE_FETCH_TIMEOUT_MS): Promise<number> {
  try {
    const state = await fetchNetInfoWithRetry();

    if (!state.isConnected || !state.isInternetReachable) {
      return BET_VALUES.ONLINE_FETCH_TIMEOUT_OFFLINE_MS;
    }

    if (state.type === 'cellular') {
      return BET_VALUES.ONLINE_FETCH_TIMEOUT_CELLULAR_MS;
    }

    return baseMs;
  } catch {
    return baseMs;
  }
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
