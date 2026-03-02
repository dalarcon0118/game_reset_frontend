import { BolitaModel, BolitaListData } from './models/bolita.types';
import { CreateBetDTO, GenericBetItemDTO } from '@/shared/services/bet/types';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';
import { BetType, ParletBet, CentenaBet, FijosCorridosBet } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BOLITA_IMPL');

const extractSingleNumber = (val: any): number | null => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const n = parseInt(val, 10);
        return isNaN(n) ? null : n;
    }
    if (Array.isArray(val) && val.length > 0) {
        const first = val[0];
        const n = typeof first === 'number' ? first : parseInt(first, 10);
        return isNaN(n) ? null : n;
    }
    if (val && typeof val === 'object') {
        if ('number' in val) return extractSingleNumber(val.number);
        if ('bet' in val) return extractSingleNumber(val.bet);
    }
    return null;
};

const parseNumbers = (bet: BetType): any => {
    if (typeof bet.numbers === 'string' && (bet.numbers.startsWith('{') || bet.numbers.startsWith('['))) {
        try {
            return JSON.parse(bet.numbers);
        } catch {
            return bet.numbers;
        }
    }
    return bet.numbers;
};

/**
 * 🛠️ DOMAIN IMPLEMENTATION
 * Pure business logic for the Bolita feature.
 * Following the TEA Clean Feature Design.
 */
export const BolitaImpl = {
    // --- Validation Logic ---
    validation: {
        parseInput: (input: string, size: number): number[] => {
            const regex = new RegExp(`.{1,${size}}`, 'g');
            const chunks = input.match(regex) || [];
            return chunks.map(chunk => parseInt(chunk, 10)).filter(n => !isNaN(n));
        },
        isValidRange: (n: number, min: number, max: number): boolean => n >= min && n <= max,
        isValidParlet: (numbers: number[]): boolean => numbers.length >= 2,
    },

    // --- Calculation Logic ---
    calculation: {
        calculateSummary: (model: BolitaModel): BolitaModel['summary'] => {
            const { entrySession } = model;

            const fijosCorridosTotal = entrySession.fijosCorridos.reduce((acc, bet) =>
                acc + (bet.fijoAmount || 0) + (bet.corridoAmount || 0), 0);

            const parletsTotal = entrySession.parlets.reduce((acc, bet) => {
                if (bet.bets && bet.bets.length >= 2 && bet.amount) {
                    const n = bet.bets.length;
                    const numCombinations = (n * (n - 1)) / 2;
                    return acc + (numCombinations * bet.amount);
                }
                return acc;
            }, 0);

            const centenasTotal = entrySession.centenas.reduce((acc, bet) =>
                acc + (bet.amount || 0), 0);

            const grandTotal = fijosCorridosTotal + parletsTotal + centenasTotal;

            return {
                ...model.summary,
                fijosCorridosTotal,
                parletsTotal,
                centenasTotal,
                grandTotal,
                hasBets: grandTotal > 0
            };
        }
    },

    // --- Persistence Logic (Preparation) ---
    persistence: {
        validateAndPrepare: (model: BolitaModel, drawId: string): { type: 'Valid'; payload: CreateBetDTO } | { type: 'Invalid'; reason: string } => {
            const { summary, entrySession, drawDetails } = model;

            if (summary.grandTotal <= 0) {
                return { type: 'Invalid', reason: 'El monto total debe ser mayor a 0.' };
            }

            const structureId = drawDetails.type === 'Success' ? drawDetails.data.owner_structure : null;
            if (!structureId) {
                return { type: 'Invalid', reason: 'Error Crítico: No se encontró la estructura propietaria del sorteo.' };
            }

            const bets: GenericBetItemDTO[] = [];

            // Fijos/Corridos
            entrySession.fijosCorridos.forEach(b => {
                if (b.fijoAmount && b.fijoAmount > 0) {
                    bets.push({
                        betTypeId: BET_TYPE_KEYS.FIJO,
                        amount: b.fijoAmount,
                        numbers: b.bet,
                        drawId
                    });
                }
                if (b.corridoAmount && b.corridoAmount > 0) {
                    bets.push({
                        betTypeId: BET_TYPE_KEYS.CORRIDO,
                        amount: b.corridoAmount,
                        numbers: b.bet,
                        drawId
                    });
                }
            });

            // Parlets
            entrySession.parlets.forEach(b => {
                if (b.amount && b.amount > 0) {
                    bets.push({
                        betTypeId: BET_TYPE_KEYS.PARLET,
                        amount: b.amount,
                        numbers: b.bets,
                        drawId
                    });
                }
            });

            // Centenas
            entrySession.centenas.forEach(b => {
                if (b.amount && b.amount > 0) {
                    bets.push({
                        betTypeId: BET_TYPE_KEYS.CENTENA,
                        amount: b.amount,
                        numbers: b.bet,
                        drawId
                    });
                }
            });

            const payload: CreateBetDTO = {
                drawId,
                amount: summary.grandTotal,
                owner_structure: Number(structureId),
                bets
            };

            return { type: 'Valid', payload };
        },

        transformBets: (bets: BetType[]): BolitaListData => {
            const parlets: ParletBet[] = [];
            const centenas: CentenaBet[] = [];
            const fijosCorridosMap = new Map<string, FijosCorridosBet>();

            bets.forEach(bet => {
                try {
                    const parsedNumbers = parseNumbers(bet);

                    if (bet.type === BET_TYPE_KEYS.PARLET) {
                        let numbers: number[] = [];
                        if (Array.isArray(parsedNumbers)) {
                            numbers = parsedNumbers.map(n => typeof n === 'number' ? n : parseInt(n, 10)).filter(n => !isNaN(n));
                        }
                        if (numbers.length > 0) {
                            parlets.push({
                                id: bet.id,
                                bets: numbers,
                                amount: bet.amount,
                                receiptCode: bet.receiptCode
                            });
                        }
                    } else if (bet.type === BET_TYPE_KEYS.CENTENA) {
                        const number = extractSingleNumber(parsedNumbers);
                        if (number !== null) {
                            centenas.push({
                                id: bet.id,
                                bet: number,
                                amount: bet.amount,
                                receiptCode: bet.receiptCode
                            });
                        }
                    } else if (bet.type === BET_TYPE_KEYS.FIJO || bet.type === BET_TYPE_KEYS.CORRIDO) {
                        const number = extractSingleNumber(parsedNumbers);
                        if (number !== null && !isNaN(number)) {
                            const key = `${number}-${bet.receiptCode || ''}`;
                            const existing = fijosCorridosMap.get(key);
                            if (existing) {
                                if (bet.type === BET_TYPE_KEYS.FIJO) {
                                    existing.fijoAmount = bet.amount;
                                } else if (bet.type === BET_TYPE_KEYS.CORRIDO) {
                                    existing.corridoAmount = bet.amount;
                                }
                            } else {
                                fijosCorridosMap.set(key, {
                                    id: bet.id,
                                    bet: number,
                                    fijoAmount: bet.type === BET_TYPE_KEYS.FIJO ? bet.amount : null,
                                    corridoAmount: bet.type === BET_TYPE_KEYS.CORRIDO ? bet.amount : null,
                                    receiptCode: bet.receiptCode,
                                });
                            }
                        }
                    }
                } catch (e) {
                    log.warn('Error transforming bet', { betId: bet.id, type: bet.type, error: e });
                }
            });

            return {
                parlets,
                centenas,
                fijosCorridos: Array.from(fijosCorridosMap.values())
            };
        }
    }
};
