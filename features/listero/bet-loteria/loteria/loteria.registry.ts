import { BetFeature } from '@/features/listero/bet-workspace/core/registry';
import { Model as GlobalModel, ListData } from '@/features/listero/bet-workspace/model';
import logger from '@/shared/utils/logger';
import { GameType, BetType, LoteriaBet } from '@/types';

import { BET_TYPE_KEYS, BACKEND_BET_CODES, BET_TYPE_KEYWORDS, isLoteriaType } from '@/shared/types/bet_types';

const log = logger.withTag('[LoteriaRegistryFeature]');
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
            const tCode = (t.code || '').toUpperCase();
            const tName = (t.name || '').toUpperCase();

            // Prioridad al código inmutable del backend
            if (([
                BACKEND_BET_CODES.LOTERIA,
                BACKEND_BET_CODES.CUATERNA,
                BACKEND_BET_CODES.CUATERNA_SEMANAL,
                BACKEND_BET_CODES.WEEKLY
            ] as string[]).includes(tCode)) return true;

            // Fallback a keywords si el código no está estandarizado
            return [
                BET_TYPE_KEYWORDS.LOTERIA,
                BET_TYPE_KEYWORDS.CUATERNA,
                BET_TYPE_KEYWORDS.SEMANAL
            ].some(keyword => tName.includes(keyword));
        });
        return { loteria: type?.id?.toString() || null };
    },

    transformBets: (bets: BetType[]): Partial<ListData> => {
        log.debug('transformBets', bets);
        const loteria: LoteriaBet[] = [];
        bets.forEach(bet => {
            // Priority 1: Check by betTypeId if we have it (should be the standard)
            // Priority 2: Robust string check via helper
            const isLoteria = isLoteriaType(bet.type || '', bet.betTypeId);

            if (isLoteria) {
                loteria.push({
                    id: bet.id,
                    bet: bet.numbers,
                    amount: bet.amount
                });
            }
        });
        return { loteria };
    },

    handles: (code: string) => {
        const lowerCode = code.toLowerCase();
        return [
            'loteria',
            'quiniela_directa',
            'cuaterna',
            BET_TYPE_KEYS.LOTERIA.toLowerCase(),
            BET_TYPE_KEYS.CUATERNA_SEMANAL.toLowerCase(),
            BET_TYPE_KEYS.QUINELA.toLowerCase()
        ].includes(lowerCode);
    },

    isValidInput: (input: string, _gameTypeCode: string) => /^[0-9]+$/.test(input) && input.length <= 4,

    getMaxLength: (_gameTypeCode: string) => 4
};
