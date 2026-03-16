/**
 * 🚀 Decision Services - Promotion Navigation Logic
 * 
 * Determines the target route and parameters for a promotion
 * based on the GameRegistry and available metadata.
 */

import { GameRegistry } from '@core/registry/game_registry';
import { Promotion } from '../model';
import { Cmd } from '@core/tea-utils/cmd';
import { CommandDescriptor } from '@core/tea-utils/cmd';

export const DecisionServices = {
    /**
     * Handles the "Participar Ahora" button click.
     * 
     * STRATEGY:
     * 1. Check draw_type_code (Most reliable backend contract).
     * 2. Fallback to bet_type_code.
     * 3. Final fallback to title analysis (Legacy).
     */
    handleParticipation: (promotion: Promotion): CommandDescriptor => {
        // 1. Try by Draw Type Code (Primary Backend Contract)
        if (promotion.draw_type_code) {
            const strategy = GameRegistry.getStrategyByDrawCode(promotion.draw_type_code);
            if (strategy) {
                return Cmd.navigate({
                    pathname: GameRegistry.resolveRouteByIntent(strategy.intent),
                    params: {
                        id: String(promotion.draw_type || ''),
                        title: promotion.title
                    }
                });
            }
        }

        // 2. Try by Bet Type Code (Secondary Backend Contract)
        if (promotion.bet_type_code) {
            const intent = GameRegistry.getIntentByBetCode(promotion.bet_type_code);
            if (intent !== 'UNKNOWN') {
                return Cmd.navigate({
                    pathname: GameRegistry.resolveRouteByIntent(intent),
                    params: {
                        id: String(promotion.draw_type || ''),
                        title: promotion.title
                    }
                });
            }
        }

        // 3. Fallback to Title Analysis (Legacy/Heuristic)
        const category = GameRegistry.getCategoryByTitle(promotion.title);
        const intent = category === 'bolita' ? 'BOLITA_ANOTATE' : 'LOTERIA_ANOTATE';
        
        return Cmd.navigate({
            pathname: GameRegistry.resolveRouteByIntent(intent),
            params: {
                id: String(promotion.draw_type || ''),
                title: promotion.title
            }
        });
    }
};
