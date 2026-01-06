import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { ListMsgType, ListMsg } from '../types/list.types';
import { Cmd } from '@/shared/core/cmd';
import { BetService } from '@/shared/services/Bet';
import { BetType } from '@/types';

const transformBetTypeToFijosCorridos = (bets: BetType[]): any[] => {
    const fijosCorridosMap = new Map<number, any>();

    bets.forEach((bet) => {
        try {
            let parsedNumbers: any;
            try {
                parsedNumbers = JSON.parse(bet.numbers);
            } catch {
                parsedNumbers = bet.numbers;
            }

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

            if (bet.type === 'Fijo' || bet.type === 'Corrido') {
                const number = extractSingleNumber(parsedNumbers);

                if (number !== null && !isNaN(number)) {
                    const existing = fijosCorridosMap.get(number);
                    if (existing) {
                        // Merge with existing bet
                        if (bet.type === 'Fijo') {
                            existing.fijoAmount = bet.amount;
                        } else if (bet.type === 'Corrido') {
                            existing.corridoAmount = bet.amount;
                        }
                    } else {
                        // Create new bet
                        fijosCorridosMap.set(number, {
                            id: bet.id,
                            bet: number,
                            fijoAmount: bet.type === 'Fijo' ? bet.amount : null,
                            corridoAmount: bet.type === 'Corrido' ? bet.amount : null,
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Error parsing bet numbers:', bet.numbers, e);
        }
    });

    return Array.from(fijosCorridosMap.values()).sort((a, b) => a.bet - b.bet);
};

const transformBetTypeToParlets = (bets: BetType[]): any[] => {
    return bets
        .filter(bet => bet.type === 'Parlet')
        .map((bet) => {
            try {
                let parsedNumbers: any;
                try {
                    parsedNumbers = JSON.parse(bet.numbers);
                } catch {
                    parsedNumbers = bet.numbers;
                }

                const extractNumberArray = (val: any): number[] => {
                    const toNum = (x: any) => (typeof x === 'number' ? x : parseInt(x, 10));
                    if (typeof val === 'string') {
                        if (val.includes('-')) {
                            return val.split('-').map(s => parseInt(s, 10)).filter((n: number) => !isNaN(n));
                        }
                        const n = parseInt(val, 10);
                        return isNaN(n) ? [] : [n];
                    }
                    if (Array.isArray(val)) return val.map(toNum).filter((n: number) => !isNaN(n));
                    if (val && typeof val === 'object') {
                        if (Array.isArray(val.numbers)) return val.numbers.map(toNum).filter((n: number) => !isNaN(n));
                        if (Array.isArray(val.pair)) return val.pair.map(toNum).filter((n: number) => !isNaN(n));
                    }
                    return [];
                };

                const numbers = extractNumberArray(parsedNumbers);

                return {
                    id: bet.id,
                    bets: numbers,
                    amount: bet.amount,
                };
            } catch (e) {
                console.warn('Error parsing parlet bet:', bet.numbers, e);
                return null;
            }
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.amount === b.amount) {
                const aKey = a.bets.join('-');
                const bKey = b.bets.join('-');
                return aKey.localeCompare(bKey);
            }
            return a.amount - b.amount;
        });
};

const transformBetTypeToCentenas = (bets: BetType[]): any[] => {
    return bets
        .filter(bet => bet.type === 'Centena')
        .map((bet) => {
            try {
                let parsedNumbers: any;
                try {
                    parsedNumbers = JSON.parse(bet.numbers);
                } catch {
                    parsedNumbers = bet.numbers;
                }

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

                const number = extractSingleNumber(parsedNumbers);

                if (number !== null && !isNaN(number)) {
                    return {
                        id: bet.id,
                        bet: number,
                        amount: bet.amount,
                    };
                }
            } catch (e) {
                console.warn('Error parsing centena bet:', bet.numbers, e);
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.amount === b.amount) return a.bet - b.bet;
            return a.amount - b.amount;
        });
};

export const updateList = (model: Model, msg: ListMsg): [Model, Cmd] => {
    return match(msg)
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }) => {
            return [
                { ...model, isLoading: true, drawId },
                Cmd.task({
                    task: () => BetService.list({ drawId }),
                    onSuccess: (bets) => ({
                        type: ListMsgType.FETCH_BETS_SUCCEEDED,
                        fijosCorridos: transformBetTypeToFijosCorridos(bets),
                        parlets: transformBetTypeToParlets(bets),
                        centenas: transformBetTypeToCentenas(bets)
                    }),
                    onFailure: (err) => ({ type: ListMsgType.FETCH_BETS_FAILED, error: String(err) })
                }),
            ] as [Model, Cmd];
        })
        .with({ type: ListMsgType.FETCH_BETS_SUCCEEDED }, ({ fijosCorridos, parlets, centenas }) => {
            return [
                {
                    ...model,
                    isLoading: false,
                    fijosCorridos,
                    parlets,
                    centenas,
                },
                Cmd.none,
            ] as [Model, Cmd];
        })
        .with({ type: ListMsgType.FETCH_BETS_FAILED }, ({ error }) => {
            return [{ ...model, isLoading: false, error }, Cmd.none] as [Model, Cmd];
        })
        .otherwise(() => [model, Cmd.none] as [Model, Cmd]);
};
