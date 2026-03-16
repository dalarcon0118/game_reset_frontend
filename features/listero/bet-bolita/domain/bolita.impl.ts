import { BolitaModel, BolitaListData } from './models/bolita.types';
import { BET_TYPE_KEYS, UI_CONSTANTS, normalizeBetType, normalizeBetTypeId, normalizeNumbers, normalizeOwnerStructure } from '@/shared/types/bet_types';
import { BetType, ParletBet, CentenaBet, FijosCorridosBet } from '@/types';
import { BetPlacementInput } from '@/shared/repositories/bet/bet.types';
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

const parseNumbers = (bet: BetType): number[] => {
    const numbers = bet.numbers;

    if (Array.isArray(numbers)) {
        // Preservar array completo del almacenamiento
        return numbers.map(n => {
            if (typeof n === 'number') return n;
            if (typeof n === 'string') {
                const parsed = parseInt(n, 10);
                return isNaN(parsed) ? null : parsed;
            }
            return null;
        }).filter((n): n is number => n !== null);
    }

    if (typeof numbers === 'string') {
        // Caso 1: JSON (para compatibilidad con storage nativo)
        if (numbers.startsWith('{') || numbers.startsWith('[')) {
            try {
                const parsed = JSON.parse(numbers);
                if (Array.isArray(parsed)) {
                    return parsed.map(n => {
                        if (typeof n === 'number') return n;
                        if (typeof n === 'string') {
                            const parsedNum = parseInt(n, 10);
                            return isNaN(parsedNum) ? null : parsedNum;
                        }
                        return null;
                    }).filter((n): n is number => n !== null);
                }
                return [extractSingleNumber(parsed)].filter((n): n is number => n !== null);
            } catch {
                // Si falla el JSON, tratar como string delimitado
            }
        }
        // Caso 2: Formato del Mapper UI (delimitado por '-')
        if (numbers.includes(UI_CONSTANTS.BET_NUMBER_DELIMITER)) {
            return numbers.split(UI_CONSTANTS.BET_NUMBER_DELIMITER)
                .map(n => parseInt(n, 10))
                .filter(n => !isNaN(n));
        }
        // Caso 3: Número simple como string
        const single = parseInt(numbers, 10);
        return isNaN(single) ? [] : [single];
    }

    if (typeof numbers === 'number') {
        return [numbers];
    }

    return [];
};

/**
 * 🛠️ DOMAIN IMPLEMENTATION
 * Pure business logic for the Bolita feature.
 * Following the TEA Clean Feature Design.
 */
export const BolitaImpl = {
    log: () => logger.withTag('BOLITA_VALIDATE_PREPARE'),

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
        calculateSummary: (data: BolitaListData): BolitaModel['summary'] => {
            const fijosCorridosTotal = data.fijosCorridos.reduce((acc, bet) =>
                acc + (bet.fijoAmount || 0) + (bet.corridoAmount || 0), 0);

            const parletsTotal = data.parlets.reduce((acc, bet) => {
                if (bet.bets && bet.bets.length >= 2 && bet.amount) {
                    const n = bet.bets.length;
                    const numCombinations = (n * (n - 1)) / 2;
                    return acc + (numCombinations * bet.amount);
                }
                return acc;
            }, 0);

            const centenasTotal = data.centenas.reduce((acc, bet) =>
                acc + (bet.amount || 0), 0);

            const grandTotal = fijosCorridosTotal + parletsTotal + centenasTotal;

            return {
                fijosCorridosTotal,
                parletsTotal,
                centenasTotal,
                grandTotal,
                hasBets: grandTotal > 0,
                isSaving: false,
                pendingReceiptCode: null
            };
        }
    },

    // --- Persistence Logic (Preparation) ---
    persistence: {
        validateAndPrepare: (model: BolitaModel, drawId: string): { type: 'Valid'; payload: BetPlacementInput[] } | { type: 'Invalid'; reason: string } => {
            BolitaImpl.log().info('validateAndPrepare triggered', { drawId, ...model });

            const { summary, entrySession, userStructureId } = model;

            if (summary.grandTotal <= 0) {
                return { type: 'Invalid', reason: 'El monto total debe ser mayor a 0.' };
            }

            if (!userStructureId) {
                return { type: 'Invalid', reason: 'Error Crítico: No se encontró la estructura del usuario para registrar la apuesta.' };
            }

            // Normalizar ownerStructure usando función centralizada
            const normalizedOwnerStructure = normalizeOwnerStructure(userStructureId);

            const bets: BetPlacementInput[] = [];

            // Fijos/Corridos
            entrySession.fijosCorridos.forEach(b => {
                if (b.fijoAmount && b.fijoAmount > 0) {
                    bets.push({
                        id: b.id,
                        type: normalizeBetType(BET_TYPE_KEYS.FIJO),
                        betTypeId: normalizeBetTypeId(BET_TYPE_KEYS.FIJO),
                        amount: b.fijoAmount,
                        numbers: normalizeNumbers(b.bet),
                        drawId,
                        ownerStructure: normalizedOwnerStructure
                    });
                }
                if (b.corridoAmount && b.corridoAmount > 0) {
                    bets.push({
                        id: b.id,
                        type: normalizeBetType(BET_TYPE_KEYS.CORRIDO),
                        betTypeId: normalizeBetTypeId(BET_TYPE_KEYS.CORRIDO),
                        amount: b.corridoAmount,
                        numbers: normalizeNumbers(b.bet),
                        drawId,
                        ownerStructure: normalizedOwnerStructure
                    });
                }
            });

            // Parlets
            entrySession.parlets.forEach(b => {
                if (b.amount && b.amount > 0) {
                    bets.push({
                        id: b.id,
                        type: normalizeBetType(BET_TYPE_KEYS.PARLET),
                        betTypeId: normalizeBetTypeId(BET_TYPE_KEYS.PARLET),
                        amount: b.amount,
                        numbers: normalizeNumbers(b.bets),
                        drawId,
                        ownerStructure: normalizedOwnerStructure
                    });
                }
            });

            // Centenas
            entrySession.centenas.forEach(b => {
                if (b.amount && b.amount > 0) {
                    bets.push({
                        id: b.id,
                        type: normalizeBetType(BET_TYPE_KEYS.CENTENA),
                        betTypeId: normalizeBetTypeId(BET_TYPE_KEYS.CENTENA),
                        amount: b.amount,
                        numbers: normalizeNumbers(b.bet),
                        drawId,
                        ownerStructure: normalizedOwnerStructure
                    });
                }
            });

            if (bets.length === 0) {
                return { type: 'Invalid', reason: 'No hay apuestas válidas para guardar.' };
            }

            return { type: 'Valid', payload: bets };
        },

        transformBets: (bets: BetType[], _identifiedBetTypes?: Record<string, string | null>): BolitaListData => {
            const parlets: ParletBet[] = [];
            const centenas: CentenaBet[] = [];
            const fijosCorridosMap = new Map<string, FijosCorridosBet>();

            bets.forEach(bet => {
                try {
                    // 1. Normalización de ID
                    const betId = bet.id || bet.externalId || `temp-${Date.now()}-${Math.random()}`;

                    // 2. Normalización de Números
                    const parsedNumbers = parseNumbers(bet);

                    // 3. Normalización del Tipo de Apuesta usando SSoT (bet_types.ts)
                    // Usamos normalizeBetType que maneja tanto IDs numéricos como nombres de texto
                    const rawType = bet.betTypeId || bet.type || '';
                    const canonicalType = normalizeBetType(String(rawType));

                    log.debug('Transforming bet', { id: betId, rawType, canonicalType, numbers: parsedNumbers });

                    // 4. Clasificación basada en el Tipo Canónico (SSoT)
                    switch (canonicalType) {
                        case BET_TYPE_KEYS.PARLET:
                            if (parsedNumbers.length >= 2) {
                                parlets.push({
                                    id: betId,
                                    bets: parsedNumbers,
                                    amount: bet.amount,
                                    receiptCode: bet.receiptCode
                                });
                            } else {
                                log.warn('Apuesta marcada como Parlet pero con números insuficientes', { betId, numbers: parsedNumbers });
                            }
                            break;

                        case BET_TYPE_KEYS.CENTENA:
                            if (parsedNumbers.length > 0) {
                                centenas.push({
                                    id: betId,
                                    bet: parsedNumbers[0],
                                    amount: bet.amount,
                                    receiptCode: bet.receiptCode
                                });
                            }
                            break;

                        case BET_TYPE_KEYS.FIJO:
                        case BET_TYPE_KEYS.CORRIDO:
                        case BET_TYPE_KEYS.FIJO_CORRIDO:
                            if (parsedNumbers.length > 0 && !isNaN(parsedNumbers[0])) {
                                const firstNumber = parsedNumbers[0];
                                const key = `${firstNumber}-${bet.receiptCode || ''}`;
                                const existing = fijosCorridosMap.get(key);

                                if (existing) {
                                    if (canonicalType === BET_TYPE_KEYS.FIJO) {
                                        existing.fijoAmount = bet.amount;
                                    } else if (canonicalType === BET_TYPE_KEYS.CORRIDO) {
                                        existing.corridoAmount = bet.amount;
                                    }
                                } else {
                                    fijosCorridosMap.set(key, {
                                        id: betId,
                                        bet: firstNumber,
                                        fijoAmount: (canonicalType === BET_TYPE_KEYS.FIJO) ? bet.amount : null,
                                        corridoAmount: (canonicalType === BET_TYPE_KEYS.CORRIDO) ? bet.amount : null,
                                        receiptCode: bet.receiptCode,
                                    });
                                }
                            }
                            break;

                        default:
                            log.warn('Tipo de apuesta no reconocido o no manejado en Bolita', { betId, canonicalType, rawType });
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
