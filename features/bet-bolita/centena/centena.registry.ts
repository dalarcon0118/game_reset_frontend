import { BetFeature } from '@/features/bet-workspace/core/registry';
import { Model as GlobalModel, ListData } from '@/features/bet-workspace/model';
import { GameType, BetType, CentenaBet } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('CENTENA_REGISTRY');

export const CentenaRegistryFeature: BetFeature = {
    key: 'centena',

    prepareForSave: (model: GlobalModel): Partial<ListData> => {
        if (model.isEditing) {
            return { centenas: model.entrySession.centenas };
        }
        return {};
    },

    getEmptyState: (): Partial<ListData> => {
        return { centenas: [] };
    },

    identifyBetTypes: (betTypes: GameType[]): Record<string, string | null> => {
        const type = betTypes.find(t => 
            (t.name || '').toUpperCase().includes('CENTENA') || 
            (t.code || '').toUpperCase() === 'CENTENA'
        );
        return { centena: type?.id?.toString() || null };
    },

    transformBets: (bets: BetType[]): Partial<ListData> => {
        const centenas: CentenaBet[] = [];
        bets.forEach(bet => {
            if (bet.type === 'Centena') {
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

                 centenas.push({
                     id: bet.id,
                     bet: number,
                     amount: bet.amount,
                     receiptCode: bet.receiptCode
                 });
            }
        });
        return { centenas };
    },

    handles: (code: string) => code === 'centena',

    isValidInput: (input: string) => /^[0-9]+$/.test(input) && input.length <= 3,

    getMaxLength: () => 3
};
