import { Model, BetSummary } from './model';

/**
 * Initial state for BetSummary
 */
export const initialSummary: BetSummary = {
    loteriaTotal: 0,
    fijosCorridosTotal: 0,
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
const isValidFijoCorrido = (bet: any) => {
    return bet.bet !== undefined && bet.bet !== null &&
           ((bet.fijoAmount || 0) > 0 || (bet.corridoAmount || 0) > 0);
};

const isValidParlet = (bet: any) => {
    return bet.bets && bet.bets.length > 0 && (bet.amount || 0) > 0;
};

const isValidCentena = (bet: any) => {
    return bet.bet !== undefined && bet.bet !== null && (bet.amount || 0) > 0;
};

const isValidLoteria = (bet: any) => {
    return bet.bet && (bet.amount || 0) > 0;
};

/**
 * Helper to calculate the summary of bets.
 * Uses entrySession when isEditing is true, otherwise uses listSession.remoteData
 */
export const calculateSummary = (model: Model): BetSummary => {
    const isSaving = model.managementSession.saveStatus.type === 'Loading';

    // Usar entrySession cuando estamos en modo edición, de lo contrario usar listSession
    const dataSource = model.isEditing ? model.entrySession :
        (model.listSession.remoteData.type === 'Success' ? model.listSession.remoteData.data : null);

    if (!dataSource) {
        return {
            ...initialSummary,
            isSaving
        };
    }

    const { fijosCorridos, parlets, centenas, loteria } = dataSource;

    const loteriaTotal = loteria.reduce((total, bet) => total + (bet.amount || 0), 0);

    const fijosCorridosTotal = fijosCorridos.reduce((total, bet) => {
        const fijoAmount = bet.fijoAmount || 0;
        const corridoAmount = bet.corridoAmount || 0;
        return total + fijoAmount + corridoAmount;
    }, 0);

    const parletsTotal = parlets.reduce((total, parlet) => {
        if (parlet.bets && parlet.bets.length > 0 && parlet.amount) {
            const numBets = parlet.bets.length;
            const parletTotal = numBets * (numBets - 1) * parlet.amount;
            return total + parletTotal;
        }
        return total;
    }, 0);

    const centenasTotal = centenas.reduce((total, centena) => total + (centena.amount || 0), 0);

    const grandTotal = loteriaTotal + fijosCorridosTotal + parletsTotal + centenasTotal;
    const count = loteria.length + fijosCorridos.length + parlets.length + centenas.length;

    // Strict validation: check if there is at least one valid bet
    const hasValidFijosCorridos = fijosCorridos.some(isValidFijoCorrido);
    const hasValidParlets = parlets.some(isValidParlet);
    const hasValidCentenas = centenas.some(isValidCentena);
    const hasValidLoteria = loteria.some(isValidLoteria);

    const hasBets = hasValidFijosCorridos || hasValidParlets || hasValidCentenas || hasValidLoteria;

    return {
        loteriaTotal,
        fijosCorridosTotal,
        parletsTotal,
        centenasTotal,
        grandTotal,
        hasBets,
        isSaving,
        count
    };
};
