import { BetFeature } from '@/features/listero/bets/core/bet-registry';
import { GameType, BetType, FijosCorridosBet } from '@/types';
import { Model as GlobalModel } from '@/features/listero/bets/core/model';
import { ListData } from '@/features/listero/bets/core/model';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('STANDARD_BET_FEATURE');

export const StandardBetFeature: BetFeature = {
    key: 'standard',

    prepareForSave: (model: GlobalModel): Partial<ListData> => {
        let sourceData: ListData | null = null;

        if (model.isEditing) {
            sourceData = model.entrySession;
        } else if (model.listSession.remoteData.type === 'Success') {
            sourceData = model.listSession.remoteData.data;
        }

        if (!sourceData) {
            return {};
        }

        return {
            fijosCorridos: sourceData.fijosCorridos,
            centenas: sourceData.centenas,
            loteria: sourceData.loteria
        };
    },

    getEmptyState: (): Partial<ListData> => {
        return {
            fijosCorridos: [],
            centenas: [],
            loteria: []
        };
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
            centena: findType(['CENTENA']),
            loteria: findType(['LOTERIA', 'LOTERÍA', 'CUATERNA', 'LS_WEEKLY', 'SEMANAL']),
        };
    },

    transformBets: (bets: BetType[]): Partial<ListData> => {
        const fijosCorridosMap = new Map<string, FijosCorridosBet>();

        // 1. Transform Fijos/Corridos
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
                            if (bet.id && !bet.id.includes('.')) {
                                existing.id = bet.id;
                            }
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

        // 2. Transform Centenas
        const centenas = bets
            .filter((bet) => bet.type === 'Centena')
            .map((bet) => {
                let number = 0;
                try {
                    if (typeof bet.numbers === 'string') {
                        number = parseInt(bet.numbers, 10);
                    } else {
                        number = Number(bet.numbers);
                    }
                } catch (e) {
                    log.warn('Error parsing centena numbers', { numbers: bet.numbers, error: e });
                }

                return {
                    id: bet.id,
                    bet: number,
                    amount: bet.amount,
                    receiptCode: bet.receiptCode,
                };
            });

        // 3. Transform Loteria
        const loteria = bets
            .filter((bet) => bet.type === 'Loteria')
            .map((bet) => ({
                id: bet.id,
                numbers: bet.numbers,
                amount: bet.amount,
                receiptCode: bet.receiptCode,
            }));

        return { fijosCorridos, centenas, loteria };
    }
};
