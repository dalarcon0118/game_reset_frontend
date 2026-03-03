import React from 'react';
import { match } from 'ts-pattern';
import { View, Text } from 'react-native';

// Import components directly
import BolitaEntryScreen from '@/features/listero/bet-bolita/presentation/screens/bolita_entry_screen';
import BolitaListPlays from '@/features/listero/bet-bolita/presentation/screens/bolita_list_plays';
import LoteriaEntryScreen from '@/features/listero/bet-loteria/screens/loteria_entry_screen';
import LoteriaListPlays from '@/features/listero/bet-loteria/screens/loteria_list_plays';

// Game component type
export type GameEntryComponent = React.ComponentType<any>;

export type GameListComponent = React.ComponentType<any>;

// Registry mapping draw type codes to components
const GAME_REGISTRY: Record<string, GameEntryComponent> = {
    'BL': BolitaEntryScreen,
    'LS_WEEKLY': LoteriaEntryScreen,
};

const GAME_LIST_REGISTRY: Record<string, GameListComponent> = {
    'BL': BolitaListPlays,
    'LS_WEEKLY': LoteriaListPlays,
};

/**
 * Get the appropriate game component for a given draw type code
 * @param drawTypeCode - The code of the draw type (e.g., 'BL', 'LS_WEEKLY')
 * @returns The corresponding React component or null if not found
 */
export function getGameComponent(drawTypeCode: string): GameEntryComponent | null {
    return GAME_REGISTRY[drawTypeCode] || null;
}

/**
 * Get the appropriate game list component for a given draw type code
 * @param drawTypeCode - The code of the draw type (e.g., 'BL', 'LS_WEEKLY')
 * @returns The corresponding React component or null if not found
 */
export function getGameListComponent(drawTypeCode: string): GameListComponent | null {
    return GAME_LIST_REGISTRY[drawTypeCode] || null;
}

/**
 * Get all supported draw type codes
 * @returns Array of supported draw type codes
 */
export function getSupportedDrawTypes(): string[] {
    return Object.keys(GAME_REGISTRY);
}

/**
 * Check if a draw type code is supported
 * @param drawTypeCode - The code to check
 * @returns True if supported, false otherwise
 */
export function isDrawTypeSupported(drawTypeCode: string): boolean {
    return drawTypeCode in GAME_REGISTRY;
}

/**
 * Render the appropriate game component based on draw type code
 * Uses ts-pattern for type-safe exhaustive matching
 * @param drawTypeCode - The code of the draw type
 * @param props - Props to pass to the component
 * @returns React element or error fallback
 */
export function renderGameComponent(
    drawTypeCode: string,
    props: { drawId?: string; title?: string }
): React.ReactElement {
    return match(drawTypeCode)
        .with('BL', () => React.createElement(BolitaEntryScreen, props))
        .with('LS_WEEKLY', () => React.createElement(LoteriaEntryScreen, props))
        .otherwise(() => React.createElement(
            View,
            { style: { padding: 20, alignItems: 'center', justifyContent: 'center' } },
            React.createElement(
                Text,
                { style: { fontSize: 20, fontWeight: 'bold' } },
                ' Game Type Not Supported '
            ),
            React.createElement(
                Text,
                null,
                `The draw type "${drawTypeCode}" is not currently supported.`
            ),
            React.createElement(
                Text,
                { style: { marginTop: 10, color: 'gray' } },
                'Please contact support if you believe this is an error.'
            )
        ));
}
