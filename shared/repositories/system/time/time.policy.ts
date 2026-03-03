import { TimeMetadata, TimeIntegrityResult } from './time.types';

/**
 * Pure functions for time synchronization and integrity policies.
 * No side effects, easy to test.
 */
export const TimePolicy = {
    /**
     * Computes the server time offset.
     * Offset = ServerTime - ClientTime
     */
    computeOffset(serverNow: number, clientNow: number): number {
        return serverNow - clientNow;
    },

    /**
     * Checks if the clock has moved backwards.
     */
    detectBackward(lastClient: number, currentClient: number, thresholdMs: number = 0): boolean {
        // If current client time is less than last recorded client time (with a small threshold)
        return currentClient < (lastClient - thresholdMs);
    },

    /**
     * Checks if the clock has jumped forward unexpectedly.
     */
    detectJump(lastClient: number, currentClient: number, maxJumpMs: number): boolean {
        const delta = currentClient - lastClient;
        // If the gap since last activity is larger than expected max jump
        // and we haven't synced in between.
        return delta > maxJumpMs;
    },

    /**
     * Evaluates integrity based on current client time and stored metadata.
     */
    evaluateIntegrity(
        currentClient: number,
        metadata: TimeMetadata | null,
        config: { maxJumpMs: number; maxBackwardMs: number }
    ): TimeIntegrityResult {
        if (!metadata) {
            return { status: 'ok', deltaMs: 0 };
        }

        const delta = currentClient - metadata.lastClientTime;

        // Check for backward clock manipulation
        if (this.detectBackward(metadata.lastClientTime, currentClient, config.maxBackwardMs)) {
            return {
                status: 'backward',
                deltaMs: delta,
                reason: `Clock moved backwards by ${Math.abs(delta)}ms`
            };
        }

        // Check for forward jumps
        if (this.detectJump(metadata.lastClientTime, currentClient, config.maxJumpMs)) {
            return {
                status: 'jump',
                deltaMs: delta,
                reason: `Unexpected clock jump of ${delta}ms`
            };
        }

        return { status: 'ok', deltaMs: delta };
    },

    /**
     * Calculates the "trusted" virtual server time.
     */
    getTrustedNow(currentClient: number, offset: number): number {
        return currentClient + offset;
    }
};
