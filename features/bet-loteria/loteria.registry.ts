import { BetFeature } from '@/features/bet-workspace/core/registry';
import { Model as GlobalModel, ListData } from '@/features/bet-workspace/model';
import { GameType, BetType, LoteriaBet } from '@/types';

export const LoteriaRegistryFeature: BetFeature = {
    key: 'loteria',

    prepareForSave: (model: GlobalModel): Partial<ListData> => {
        if (model.isEditing) {
            return { loteria: model.entrySession.loteria };
        }
        return {};
    },

    getEmptyState: (): Partial<ListData> => {
        return { loteria: [] };
    },

    identifyBetTypes: (betTypes: GameType[]): Record<string, string | null> => {
        const type = betTypes.find(t => {
            const tName = (t.name || '').toUpperCase();
            return ['LOTERIA', 'LOTERÍA', 'CUATERNA', 'LS_WEEKLY', 'SEMANAL'].some(keyword => tName.includes(keyword));
        });
        return { loteria: type?.id?.toString() || null };
    },

    transformBets: (bets: BetType[]): Partial<ListData> => {
        const loteria: LoteriaBet[] = [];
        bets.forEach(bet => {
            if (bet.type === 'Loteria' || bet.type === 'Cuaterna Semanal') {
                loteria.push({
                    id: bet.id,
                    bet: bet.numbers,
                    amount: bet.amount
                });
            }
        });
        return { loteria };
    },

    handles: (code: string) => ['loteria', 'quiniela_directa', 'cuaterna'].includes(code.toLowerCase()),

    isValidInput: (input: string) => /^[0-9]+$/.test(input) && input.length <= 4,

    getMaxLength: () => 4
};
