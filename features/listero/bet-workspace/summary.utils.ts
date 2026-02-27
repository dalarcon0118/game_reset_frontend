import { BetSummary, ListData } from './model';

/**
 * Initial state for BetSummary
 */
export const initialSummary: BetSummary = {
    loteriaTotal: 0,
    parletsTotal: 0,
    centenasTotal: 0,
    grandTotal: 0,
    hasBets: false,
    isSaving: false,
    count: 0
};

/**
 * Validation helpers
 */
export const isValidParlet = (bet: any) => {
    return bet.bets && bet.bets.length > 0 && (bet.amount || 0) > 0;
};

export const isValidCentena = (bet: any) => {
    return bet.bet !== undefined && bet.bet !== null && (bet.amount || 0) > 0;
};

export const isValidLoteria = (bet: any) => {
    return bet.bet && (bet.amount || 0) > 0;
};

/**
 * Individual calculation helpers
 */
const calculateLoteriaTotal = (loteria: any[]) =>
    loteria.reduce((total, bet) => total + (bet.amount || 0), 0);

const calculateParletsTotal = (parlets: any[]) =>
    parlets.reduce((total, parlet) => total + (parlet.amount || 0), 0);

const calculateCentenasTotal = (centenas: any[]) =>
    centenas.reduce((total, centena) => total + (centena.amount || 0), 0);

/**
 * Pure function to calculate the summary of bets.
 * Does not depend on the global Model, only on the necessary data.
 */
export const calculateSummaryFromData = (
    data: ListData,
    isSaving: boolean = false
): BetSummary => {
    const { parlets, centenas, loteria } = data;

    const loteriaTotal = calculateLoteriaTotal(loteria);
    const parletsTotal = calculateParletsTotal(parlets);
    const centenasTotal = calculateCentenasTotal(centenas);

    const grandTotal = loteriaTotal + parletsTotal + centenasTotal;
    const count = loteria.length + parlets.length + centenas.length;

    const hasBets = parlets.some(isValidParlet) ||
        centenas.some(isValidCentena) ||
        loteria.some(isValidLoteria);

    return {
        loteriaTotal,
        parletsTotal,
        centenasTotal,
        grandTotal,
        hasBets,
        isSaving,
        count
    };
};
