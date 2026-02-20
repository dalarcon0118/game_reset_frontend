import { BetFeature } from '@/features/bet-workspace/core/registry';
import { Model as GlobalModel, ListData } from '@/features/bet-workspace/model';
import { GameType, BetType, ParletBet } from '@/types';

export const ParletRegistryFeature: BetFeature = {
    key: 'parlet',

    prepareForSave: (model: GlobalModel): Partial<ListData> => {
        if (model.isEditing) {
            return { parlets: model.entrySession.parlets };
        }
        return {};
    },

    getEmptyState: (): Partial<ListData> => {
        return { parlets: [] };
    },

    identifyBetTypes: (betTypes: GameType[]): Record<string, string | null> => {
         const type = betTypes.find(t => 
             (t.name || '').toUpperCase().includes('PARLET') || 
             (t.code || '').toUpperCase() === 'PARLET'
         );
         return { parlet: type?.id?.toString() || null };
    },

    transformBets: (bets: BetType[]): Partial<ListData> => {
        const parlets: ParletBet[] = [];
        
        bets.forEach(bet => {
            if (bet.type === 'Parlet') {
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

                // Expecting array of numbers
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
            }
        });

        return { parlets };
    },

    handles: (code: string) => code === 'parlet',

    isValidInput: (input: string) => /^[0-9]+$/.test(input) && input.length <= 2,

    getMaxLength: () => 2
};
