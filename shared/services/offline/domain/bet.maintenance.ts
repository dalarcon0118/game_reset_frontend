/**
 * Políticas de mantenimiento puras para el dominio de apuestas
 */
import { PendingBetV2, SYNC_CONSTANTS } from '../types';

export const BetMaintenancePolicies = {
    /**
     * Identifica y bloquea apuestas que superan el tiempo límite sin sincronizar
     */
    blockOldBets: (currentTime: number) => (bets: PendingBetV2[]) => {
        let changes = 0;
        const timeout = SYNC_CONSTANTS.BLOCK_AFTER_HOURS * 3600000;
        const updated = bets.map(bet => {
            if ((bet.status === 'pending' || bet.status === 'error') && (currentTime - bet.timestamp > timeout)) {
                changes++;
                return {
                    ...bet,
                    status: 'blocked' as const,
                    lastError: `Bloqueado por más de ${SYNC_CONSTANTS.BLOCK_AFTER_HOURS}h sin sincronizar`
                };
            }
            return bet;
        });
        return { updated, changes };
    },

    /**
     * Filtra las apuestas para el reset nocturno (mantiene solo synced y blocked)
     */
    midnightReset: () => (bets: PendingBetV2[]) => {
        const toKeep = bets.filter(bet =>
            bet.status === 'synced' || bet.status === 'blocked'
        );
        return {
            updated: toKeep,
            changes: bets.length - toKeep.length
        };
    }
};
