import { settings } from '../../../../config/settings';

/**
 * Helper to verify telemetry persistence in the backend.
 * Used for E2E tests to ensure the "Deterministic Loop Closure".
 */
export const TelemetryVerifier = {
    /**
     * Polls the backend until the given traceId is found or timeout is reached.
     * @param traceId The unique trace ID to look for
     * @param maxRetries Maximum number of retries (default: 10)
     * @param delayMs Delay between retries in milliseconds (default: 1000)
     * @returns Object with found status and event details if found
     */
    async waitForTrace(traceId: string, maxRetries = 10, delayMs = 1000): Promise<{
        found: boolean;
        event?: {
            type: string;
            received_at: string;
        };
    }> {
        const url = `${settings.api.baseUrl}/v1/system/telemetry/verify-trace/${traceId}/`;
        
        console.log(`[E2E_TELEMETRY] Starting verification for trace: ${traceId}`);
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        // Note: Depending on security settings, we might need a token here
                        // For now, we assume the verification endpoint might be reachable 
                        // or we'll need to inject a test session token.
                    }
                });

                if (response.status === 200) {
                    const data = await response.json();
                    if (data.found) {
                        console.log(`[E2E_TELEMETRY] Trace ${traceId} found after ${i + 1} attempts.`);
                        return {
                            found: true,
                            event: {
                                type: data.event_type,
                                received_at: data.received_at
                            }
                        };
                    }
                } else if (response.status === 404) {
                    // Not found yet, continue polling
                    console.log(`[E2E_TELEMETRY] Trace ${traceId} not found (Attempt ${i + 1}/${maxRetries})...`);
                } else {
                    console.warn(`[E2E_TELEMETRY] Unexpected response: ${response.status}`);
                }
            } catch (error) {
                console.error(`[E2E_TELEMETRY] Error during verification poll:`, error);
            }

            // Wait before next attempt
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        console.error(`[E2E_TELEMETRY] Timeout reached. Trace ${traceId} never appeared in backend.`);
        return { found: false };
    }
};
