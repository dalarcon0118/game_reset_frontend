import { BetFeature } from '@/features/listero/bet-workspace/core/registry';
import { Model as GlobalModel, ListData } from '@/features/listero/bet-workspace/model';
import logger from '@/shared/utils/logger';
import { GameType, BetType, LoteriaBet } from '@/types';

import { BET_TYPE_KEYS, isLoteriaType, resolveLoteriaBetTypeId } from '@/shared/types/bet_types';

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
        return { loteria: resolveLoteriaBetTypeId(betTypes) };
    },

    transformBets: (bets: BetType[], identifiedBetTypes?: Record<string, string | null>): Partial<ListData> => {
        log.debug('transformBets', { betCount: bets.length, identifiedBetTypes });
        const loteria: LoteriaBet[] = [];

        // Extraer los IDs de lotería identificados
        const knownLoteriaIds = identifiedBetTypes?.loteria
            ? [identifiedBetTypes.loteria]
            : undefined;

        bets.forEach(bet => {
            // Priority 1: Check against identified betTypes from backend
            // Priority 2: Robust string check via helper
            const isLoteria = isLoteriaType(bet.type || '', bet.betTypeId, knownLoteriaIds);

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
