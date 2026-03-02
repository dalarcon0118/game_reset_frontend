import { CreateBetDTO } from '@/shared/services/bet/types';
import { BetType } from '@/types';
import { BolitaModel, BolitaListData } from './models/bolita.types';

/**
 * 🧱 DOMAIN PORTS
 * Interfaces and contracts for the Bolita feature.
 * Following the TEA Clean Feature Design.
 */
export interface IBolitaPersistence {
    validateAndPrepare(model: BolitaModel, drawId: string): { type: 'Valid'; payload: CreateBetDTO } | { type: 'Invalid'; reason: string };
    transformBets(bets: BetType[]): BolitaListData;
}

export interface IBolitaCalculation {
    calculateSummary(model: BolitaModel): BolitaModel['summary'];
}

export interface IBolitaValidation {
    parseInput(input: string, size: number): number[];
    isValidRange(n: number, min: number, max: number): boolean;
    isValidParlet(numbers: number[]): boolean;
}
