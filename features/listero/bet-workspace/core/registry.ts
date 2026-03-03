import { GameType, BetType } from '@/types';
import { ListData } from './types';

/**
 * Interface that all bet features must implement to participate in the management process.
 * This contract ensures that the management module remains agnostic of specific bet logic.
 */
export interface BetFeature {
    /**
     * Unique identifier for the feature (e.g., 'parlet', 'standard').
     */
    key: string;

    /**
     * Prepares the data for saving to the backend.
     * This is where domain-specific logic (like calculating totals) should happen.
     * 
     * @param model The global application state
     * @returns A partial ListData object containing only the keys relevant to this feature.
     */
    prepareForSave(model: any): Partial<ListData>;

    /**
     * Returns the empty state for this feature.
     * Used when resetting the bets.
     * 
     * @returns A partial ListData object with empty arrays/values.
     */
    getEmptyState(): Partial<ListData>;

    /**
     * Identifies the GameType IDs relevant to this feature from the list of available types.
     * 
     * @param availableTypes The list of GameTypes fetched from the backend.
     * @returns A map of internal keys to GameType IDs (as strings).
     */
    identifyBetTypes(availableTypes: GameType[]): Record<string, string | null>;

    /**
     * Transforms raw bets from the backend into the internal structure for this feature.
     * 
     * @param bets The raw bets fetched from the backend.
     * @returns A partial ListData object containing the transformed bets for this feature.
     */
    transformBets(bets: BetType[]): Partial<ListData>;

    /**
     * Checks if this feature handles the given game type code.
     * @param gameTypeCode The game type code (e.g., 'fijo', 'parlet').
     */
    handles(gameTypeCode: string): boolean;

    /**
     * Validates if the input string is a valid bet number for this feature and game type.
     * @param input The input string to validate.
     * @param gameTypeCode The game type code.
     */
    isValidInput(input: string, gameTypeCode: string): boolean;

    /**
     * Returns the maximum length for bet numbers in this feature and game type.
     * @param gameTypeCode The game type code.
     */
    getMaxLength(gameTypeCode: string): number;
}

/**
 * Registry to manage all bet features.
 * The management module interacts ONLY with this registry, never directly with features.
 */
export class BetRegistry {
    private static features: BetFeature[] = [];

    /**
     * Registers a new feature.
     */
    static register(feature: BetFeature) {
        if (!feature || !feature.key) {
            console.warn('BetRegistry: Attempted to register invalid feature', feature);
            return;
        }
        // Prevent duplicate registration
        if (!this.features.find(f => f.key === feature.key)) {
            this.features.push(feature);
        }
    }

    /**
     * Finds a registered feature that handles the given game type code.
     */
    static getFeatureForType(gameTypeCode: string): BetFeature | undefined {
        return this.features.find(feature => feature.handles(gameTypeCode));
    }

    /**
     * Prepares all data for saving by aggregating results from all registered features.
     */
    static prepareAllForSave(model: any): ListData {
        let combinedData: Partial<ListData> = {};

        this.features.forEach(feature => {
            const featureData = feature.prepareForSave(model);
            combinedData = { ...combinedData, ...featureData };
        });

        // Ensure we return a complete ListData object (merging with defaults if necessary)
        return {
            fijosCorridos: [],
            parlets: [],
            centenas: [],
            loteria: [],
            ...combinedData
        } as ListData;
    }

    /**
     * Returns the combined empty state from all features.
     */
    static getEmptyState(): ListData {
        let combinedState: Partial<ListData> = {};

        this.features.forEach(feature => {
            const featureState = feature.getEmptyState();
            combinedState = { ...combinedState, ...featureState };
        });

        return {
            fijosCorridos: [],
            parlets: [],
            centenas: [],
            loteria: [],
            ...combinedState
        } as ListData;
    }

    /**
     * Identifies all bet types across all features.
     */
    static identifyAllBetTypes(availableTypes: GameType[]): Record<string, string | null> {
        let combinedTypes: Record<string, string | null> = {};

        this.features.forEach(feature => {
            const types = feature.identifyBetTypes(availableTypes);
            combinedTypes = { ...combinedTypes, ...types };
        });

        return combinedTypes;
    }

    /**
     * Transforms raw bets from the backend into the internal structure using all registered features.
     */
    static transformAllBets(bets: BetType[]): ListData {
        let combinedData: Partial<ListData> = {};

        this.features.forEach(feature => {
            const transformedData = feature.transformBets(bets);
            combinedData = { ...combinedData, ...transformedData };
        });

        return {
            fijosCorridos: [],
            parlets: [],
            centenas: [],
            loteria: [],
            ...combinedData
        } as ListData;
    }

    /**
     * Get all registered features
     */
    static getFeatures(): BetFeature[] {
        return this.features;
    }
}
