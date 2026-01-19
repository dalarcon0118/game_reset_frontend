import React from 'react';
import { match } from 'ts-pattern';

// Import components directly (lazy loading can be added later if needed)
import BolitaEntryScreen from './bolita/screens/BolitaEntryScreen';
import LoteriaEntryScreen from './loteria/screens/LoteriaEntryScreen';

// Game component type
export type GameEntryComponent = React.ComponentType<{
    drawId?: string;
    title?: string;
}>;

// Registry mapping draw type codes to components
const GAME_REGISTRY: Record<string, GameEntryComponent> = {
    'BL': BolitaEntryScreen,
    'LS_WEEKLY': LoteriaEntryScreen,
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
        .otherwise(() => React.createElement('div', {
            style: { padding: 20, textAlign: 'center' }
        }, [
            React.createElement('h2', { key: 'title' }, 'Game Type Not Supported'),
            React.createElement('p', { key: 'message' }, `The draw type "${drawTypeCode}" is not currently supported.`),
            React.createElement('p', { key: 'contact' }, 'Please contact support if you believe this is an error.')
        ]));
}
