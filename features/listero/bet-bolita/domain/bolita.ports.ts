import { BetType } from '@/types';
import { BolitaModel, BolitaListData } from './models/bolita.types';
import { BetPlacementInput } from '@/shared/repositories/bet/bet.types';

/**
 * 🧱 DOMAIN PORTS
 * Interfaces and contracts for the Bolita feature.
 * Following the TEA Clean Feature Design.
 */
export interface IBolitaPersistence {
    validateAndPrepare(
        model: BolitaModel,
        drawId: string,
        dynamicBetTypeIds?: Record<string, string | null>
    ): { type: 'Valid'; payload: BetPlacementInput[] } | { type: 'Invalid'; reason: string };
    transformBets(bets: BetType[], _identifiedBetTypes?: Record<string, string | null>): BolitaListData;
}

export interface IBolitaCalculation {
    calculateSummary(model: BolitaModel): BolitaModel['summary'];
}

export interface IBolitaValidation {
    parseInput(input: string, size: number): number[];
    isValidRange(n: number, min: number, max: number): boolean;
    isValidParlet(numbers: number[]): boolean;
}
