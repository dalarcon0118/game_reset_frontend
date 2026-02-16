import { BetFeature } from '@/features/listero/bets/core/bet-registry';
import { GameType, BetType } from '@/types';
import { Model as GlobalModel } from '@/features/listero/bets/core/model';
import { ParletDomain } from './parlet.domain';
import { ListData } from '@/features/listero/bets/core/model';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('PARLET_FEATURE');

export const ParletFeature: BetFeature = {
    key: 'parlet',

    prepareForSave: (model: GlobalModel): Partial<ListData> => {
        let parlets = [];

        if (model.isEditing) {
            parlets = model.entrySession.parlets;
        } else if (model.listSession.remoteData.type === 'Success') {
            parlets = model.listSession.remoteData.data.parlets;
        }

        // Apply domain logic: Calculate total amount for each parlet
        const processedParlets = parlets.map(parlet => ({
            ...parlet,
            amount: ParletDomain.calculateTotalAmount(parlet)
        }));

        return {
            parlets: processedParlets
        };
    },

    getEmptyState: (): Partial<ListData> => {
        return {
            parlets: []
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
            parlet: findType(['PARLET'])
        };
    },

    transformBets: (bets: BetType[]): Partial<ListData> => {
        const parlets = bets
            .filter((bet) => bet.type === 'Parlet')
            .map((bet) => {
                let parsedNumbers: number[] = [];
                try {
                    if (typeof bet.numbers === 'string') {
                        if (bet.numbers.startsWith('[') || bet.numbers.startsWith('{')) {
                            const parsed = JSON.parse(bet.numbers);
                            if (Array.isArray(parsed)) {
                                parsedNumbers = parsed.map(n => typeof n === 'number' ? n : parseInt(n, 10));
                            } else if (typeof parsed === 'object' && parsed.numbers) {
                                parsedNumbers = parsed.numbers.map((n: any) => typeof n === 'number' ? n : parseInt(n, 10));
                            }
                        } else if (bet.numbers.includes('-')) {
                            parsedNumbers = bet.numbers.split('-').map((n) => parseInt(n, 10));
                        } else {
                            parsedNumbers = [parseInt(bet.numbers, 10)];
                        }
                    }
                } catch (e) {
                    log.warn('Error parsing parlet numbers', { numbers: bet.numbers, error: e });
                }

                return {
                    id: bet.id,
                    bets: parsedNumbers,
                    amount: bet.amount,
                    receiptCode: bet.receiptCode,
                };
            });

        return { parlets };
    }
};
