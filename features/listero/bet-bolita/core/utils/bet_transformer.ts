import { BetType, ParletBet, CentenaBet, FijosCorridosBet } from '@/types';
import { BET_TYPE_KEYS, BACKEND_BET_CODES, BET_TYPE_KEYWORDS } from '@/shared/types/bet_types';
import { logger } from '@/shared/utils/logger';
import { BolitaListData } from '../model';

const log = logger.withTag('BOLITA_BET_TRANSFORMER');

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

export const transformBolitaBets = (bets: BetType[]): BolitaListData => {
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
};
