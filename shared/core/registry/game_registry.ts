/**
 * 🎮 Game Registry - Single Source of Truth for Game Types and Behaviors
 * 
 * This registry maps STABLE BACKEND CODES to frontend-specific logic,
 * eliminating the need for hardcoded IDs or semantic title analysis.
 */

import { BetType, ListData, FijosCorridosBet, GameType } from '@/types';

export type GameCategory = 'bolita' | 'loteria';

export type GameIntent =
    | 'BOLITA_ANOTATE'
    | 'BOLITA_LIST'
    | 'LOTERIA_ANOTATE'
    | 'LOTERIA_LIST'
    | 'UNKNOWN';

export interface GameStrategy {
    category: GameCategory;
    label: string;
    intent: GameIntent;
    isValidInput: (input: string) => boolean;
    getMaxLength: () => number;
}

/**
 * Mapeo de Intents a Rutas Reales (Centralizado)
 */
export const INTENT_ROUTES: Record<GameIntent, string> = {
    'BOLITA_ANOTATE': '/lister/bets/bolita/anotate',
    'BOLITA_LIST': '/lister/bets/bolita/list',
    'LOTERIA_ANOTATE': '/lister/bets/loteria/anotate',
    'LOTERIA_LIST': '/lister/bets/loteria/list',
    'UNKNOWN': '/lister/(tabs)/dashboard'
};

/**
 * Registry of strategies indexed by DRAW TYPE CODES (Backend Contract)
 */
const BOLITA_STRATEGY: GameStrategy = {
    category: 'bolita',
    label: 'Bolita',
    intent: 'BOLITA_ANOTATE',
    isValidInput: (input: string) => /^[0-9]+$/.test(input) && input.length <= 2,
    getMaxLength: () => 2
};

const LOTERIA_STRATEGY: GameStrategy = {
    category: 'loteria',
    label: 'Lotería',
    intent: 'LOTERIA_ANOTATE',
    isValidInput: (input: string) => /^[0-9]+$/.test(input) && input.length <= 4,
    getMaxLength: () => 4
};

const DEFAULT_DRAW_TYPE_STRATEGIES: Record<string, GameStrategy> = {
    'BL': BOLITA_STRATEGY,
    'LS_WEEKLY': LOTERIA_STRATEGY,
};

let dynamicDrawStrategies: Record<string, GameStrategy> = { ...DEFAULT_DRAW_TYPE_STRATEGIES };

/**
 * Registry of BET TYPE CODES (Backend Contract)
 */
export const BET_TYPE_STRATEGIES: Record<string, GameStrategy> = {
    'FIJO': BOLITA_STRATEGY,
    'PARLET': BOLITA_STRATEGY,
    'CORRIDO': BOLITA_STRATEGY,
    'CENTENA': {
        ...BOLITA_STRATEGY,
        label: 'Centena',
        isValidInput: (input: string) => /^[0-9]+$/.test(input) && input.length <= 3,
        getMaxLength: () => 3
    },
    'LOTERIA': LOTERIA_STRATEGY,
    'WEEKLY': LOTERIA_STRATEGY,
    'CUATERNA': LOTERIA_STRATEGY,
};

export const GameRegistry = {
    /**
     * Sincroniza el registro con los tipos de sorteo recibidos del backend.
     * Permite registrar nuevos juegos dinámicamente si el código es reconocido.
     */
    syncWithBackend: (drawTypes: any[]) => {
        drawTypes.forEach(dt => {
            const code = (dt.code || '').toUpperCase();
            if (!dynamicDrawStrategies[code]) {
                // Lógica de auto-descubrimiento basada en keywords si el código no existe
                const name = (dt.name || '').toLowerCase();
                if (name.includes('loteria') || name.includes('lotería')) {
                    dynamicDrawStrategies[code] = {
                        ...DEFAULT_DRAW_TYPE_STRATEGIES['LS_WEEKLY'],
                        label: dt.name,
                    };
                } else {
                    dynamicDrawStrategies[code] = {
                        ...DEFAULT_DRAW_TYPE_STRATEGIES['BL'],
                        label: dt.name,
                    };
                }
            }
        });
    },

    /**
     * Resuelve una ruta a partir de un Intent
     */
    resolveRouteByIntent: (intent: GameIntent): string => {
        return INTENT_ROUTES[intent] || INTENT_ROUTES['UNKNOWN'];
    },

    /**
     * Get strategy by Draw Type Code (e.g., 'BL', 'LS_WEEKLY')
     */
    getStrategyByDrawCode: (code: string): GameStrategy | null => {
        return dynamicDrawStrategies[code.toUpperCase()] || null;
    },

    /**
     * Get category by Bet Type Code (e.g., 'FIJO', 'LOTERIA')
     */
    getCategoryByBetCode: (code: string): GameCategory | null => {
        return BET_TYPE_STRATEGIES[code.toUpperCase()]?.category || null;
    },

    /**
     * Get strategy by Bet Type Code
     */
    getStrategyByBetCode: (code: string): GameStrategy | null => {
        return BET_TYPE_STRATEGIES[code.toUpperCase()] || null;
    },

    /**
     * Get intent by Bet Type Code
     */
    getIntentByBetCode: (code: string): GameIntent => {
        return BET_TYPE_STRATEGIES[code.toUpperCase()]?.intent || 'UNKNOWN';
    },

    /**
     * SSoT: Get category by Draw object.
     * Prioritizes Code (Backend Contract) -> Pre-mapped Category -> Title Analysis (Fallback)
     */
    getCategoryByDraw: (draw: { code?: string; category?: GameCategory; name?: string; source?: string }): GameCategory => {
        // 1. Prioridad: Código de backend (SSoT real)
        if (draw.code) {
            const strategy = GameRegistry.getStrategyByDrawCode(draw.code);
            if (strategy) return strategy.category;
        }

        // 2. Fallback: Categoría ya mapeada o análisis de título
        return draw.category || GameRegistry.getCategoryByTitle(draw.name || draw.source || '');
    },

    /**
     * Validates if the input string is a valid bet number for the given draw or bet code.
     */
    isValidInput: (input: string, code: string): boolean => {
        const strategy = GameRegistry.getStrategyByDrawCode(code) || GameRegistry.getStrategyByBetCode(code);
        return strategy ? strategy.isValidInput(input) : /^[0-9]+$/.test(input) && input.length <= 2;
    },

    /**
     * Returns the maximum length for bet numbers for the given draw or bet code.
     */
    getMaxLength: (code: string): number => {
        const strategy = GameRegistry.getStrategyByDrawCode(code) || GameRegistry.getStrategyByBetCode(code);
        return strategy ? strategy.getMaxLength() : 2;
    },

    /**
     * Fallback helper for legacy semantic identification (Title analysis)
     * SHOULD BE DEPRECATED in favor of using codes.
     */
    getCategoryByTitle: (title: string): GameCategory => {
        const normalized = (title || '').toLowerCase();
        if (normalized.includes('loteria') || normalized.includes('lotería')) {
            return 'loteria';
        }
        return 'bolita';
    },

    /**
     * Identifies the IDs for common bet types from a list of GameTypes.
     * Centralizes dynamic ID mapping based on stable backend codes.
     */
    identifyBetTypes: (gameTypes: GameType[]): Record<string, string | null> => {
        const map: Record<string, string | null> = {
            fijo: null,
            corrido: null,
            parlet: null,
            centena: null,
            loteria: null
        };

        gameTypes.forEach(gt => {
            const code = (gt.code || '').toUpperCase();
            const id = gt.id ? String(gt.id) : null;

            if (code === 'FIJO') map.fijo = id;
            else if (code === 'CORRIDO') map.corrido = id;
            else if (code === 'PARLET') map.parlet = id;
            else if (code === 'CENTENA') map.centena = id;
            else if (code === 'LOTERIA' || code === 'WEEKLY' || code === 'CUATERNA') map.loteria = id;
        });

        return map;
    },

    /**
     * Returns the default empty state for bets.
     */
    getEmptyState: (): ListData => ({
        fijosCorridos: [],
        parlets: [],
        centenas: [],
        loteria: []
    }),

    /**
     * Transforms raw bets from the backend into the internal structure (ListData).
     * Centralizes logic formerly fragmented across multiple registries.
     */
    transformAllBets: (bets: BetType[]): ListData => {
        const result = GameRegistry.getEmptyState();
        const fcMap: Record<string, FijosCorridosBet> = {};

        bets.forEach(bet => {
            const betTypeCode = (bet.type || '').toUpperCase();
            const strategy = GameRegistry.getStrategyByBetCode(betTypeCode);

            if (!strategy) return;

            const receiptCode = bet.receiptCode || '-----';
            const numbers = bet.numbers;

            // Logica especifica para Bolita (Fijos/Corridos/Parlets/Centenas)
            if (betTypeCode === 'FIJO' || betTypeCode === 'CORRIDO') {
                const key = `${numbers}-${receiptCode}`;
                if (!fcMap[key]) {
                    fcMap[key] = {
                        id: bet.id,
                        bet: typeof numbers === 'number' ? numbers : parseInt(numbers, 10),
                        fijoAmount: null,
                        corridoAmount: null,
                        receiptCode: bet.receiptCode,
                        betTypeid: bet.betTypeId,
                        drawid: bet.drawId
                    };
                }
                if (betTypeCode === 'FIJO') {
                    fcMap[key].fijoAmount = bet.amount;
                } else {
                    fcMap[key].corridoAmount = bet.amount;
                }
            } else if (betTypeCode === 'PARLET') {
                result.parlets.push({
                    id: bet.id,
                    bets: Array.isArray(numbers) ? numbers : [],
                    amount: bet.amount,
                    receiptCode: bet.receiptCode,
                    betTypeid: bet.betTypeId,
                    drawid: bet.drawId
                });
            } else if (betTypeCode === 'CENTENA') {
                result.centenas.push({
                    id: bet.id,
                    bet: typeof numbers === 'number' ? numbers : parseInt(numbers, 10),
                    amount: bet.amount,
                    receiptCode: bet.receiptCode,
                    betTypeid: bet.betTypeId,
                    drawid: bet.drawId
                });
            } else if (strategy.category === 'loteria') {
                result.loteria.push({
                    id: bet.id,
                    bet: String(numbers),
                    amount: bet.amount,
                    receiptCode: bet.receiptCode,
                    betTypeid: bet.betTypeId,
                    drawid: bet.drawId
                });
            }
        });

        result.fijosCorridos = Object.values(fcMap);
        return result;
    }
};
