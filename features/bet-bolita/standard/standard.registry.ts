import { BetFeature } from '@/features/bet-workspace/core/registry';
import { Model as GlobalModel, ListData } from '@/features/bet-workspace/model';
import { GameType, BetType, FijosCorridosBet } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('STANDARD_REGISTRY');

export const StandardRegistryFeature: BetFeature = {
    key: 'standard',

    prepareForSave: (model: GlobalModel): Partial<ListData> => {
        if (model.isEditing) {
            return { fijosCorridos: model.entrySession.fijosCorridos };
        }
        return {};
    },

    getEmptyState: (): Partial<ListData> => {
        return { fijosCorridos: [] };
    },

    identifyBetTypes: (betTypes: GameType[]): Record<string, string | null> => {
        const findType = (names: string[]) => {
            const type = betTypes.find(t => {
                const tName = (t.name || '').toUpperCase();
                const tCode = (t.code || '').toUpperCase();
                return names.some(name => {
                    const searchName = name.toUpperCase();
                    return tName.includes(searchName) || tCode === searchName;
                });
            });
            return type?.id?.toString() || null;
        };

        return {
            fijo: findType(['FIJO']),
            corrido: findType(['CORRIDO']),
        };
    },

    transformBets: (bets: BetType[]): Partial<ListData> => {
        const fijosCorridosMap = new Map<string, FijosCorridosBet>();

        bets.forEach((bet) => {
            try {
                if (bet.type === 'Fijo' || bet.type === 'Corrido') {
                    let parsedNumbers: any;
                    if (typeof bet.numbers === 'string' && (bet.numbers.startsWith('{') || bet.numbers.startsWith('['))) {
                        try {
                            parsedNumbers = JSON.parse(bet.numbers);
                        } catch {
                            parsedNumbers = bet.numbers;
                        }
                    } else {
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
                        const key = `${number}-${bet.receiptCode || ''}`;
                        const existing = fijosCorridosMap.get(key);
                        if (existing) {
                            if (bet.type === 'Fijo') {
                                existing.fijoAmount = bet.amount;
                            } else if (bet.type === 'Corrido') {
                                existing.corridoAmount = bet.amount;
                            }
                            // Keep existing ID or update?
                        } else {
                            fijosCorridosMap.set(key, {
                                id: bet.id,
                                bet: number,
                                fijoAmount: bet.type === 'Fijo' ? bet.amount : null,
                                corridoAmount: bet.type === 'Corrido' ? bet.amount : null,
                                receiptCode: bet.receiptCode,
                            });
                        }
                    }
                }
            } catch (e) {
                log.warn('Error parsing bet numbers', { numbers: bet.numbers, error: e });
            }
        });

        const fijosCorridos = Array.from(fijosCorridosMap.values()).sort((a, b) => {
            if (a.receiptCode !== b.receiptCode) return (a.receiptCode || '').localeCompare(b.receiptCode || '');
            return a.bet - b.bet;
        });

        return { fijosCorridos };
    },

    handles: (code: string) => code === 'fijo' || code === 'corrido',

    isValidInput: (input: string, code: string) => {
        if (!/^[0-9]+$/.test(input)) return false;
        if (code === 'fijo') return input.length <= 2;
        if (code === 'corrido') return input.length <= 3;
        return false;
    },

    getMaxLength: (code: string) => code === 'corrido' ? 3 : 2
};
