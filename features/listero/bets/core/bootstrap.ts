import { BetRegistry } from '@/features/listero/bets/core/bet-registry';
import { ParletFeature } from '@/features/listero/bets/features/parlet/parlet.feature';
import { StandardBetFeature } from '@/features/listero/bets/core/standard-bet.feature';

let isInitialized = false;

/**
 * Initializes the bet features registry.
 * This should be called once at the application startup or feature initialization.
 * It's idempotent, so multiple calls are safe.
 */
export const initializeBetFeatures = () => {
    if (isInitialized) {
        return;
    }

    // Register all available bet features
    BetRegistry.register(StandardBetFeature);
    BetRegistry.register(ParletFeature);

    isInitialized = true;
};
