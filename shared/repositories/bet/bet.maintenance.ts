/**
 * Políticas de mantenimiento puras para el dominio de apuestas.
 * Estas funciones son puras y no dependen de la infraestructura de almacenamiento.
 */
import { BetDomainModel } from './bet.types';
import { SYNC_CONSTANTS } from '@core/offline-storage/types';

export const BetMaintenancePolicies = {
    /**
     * Identifica y bloquea apuestas que superan el tiempo límite sin sincronizar
     */
    blockOldBets: (currentTime: number) => (bets: BetDomainModel[]) => {
        let changes = 0;
        const timeout = SYNC_CONSTANTS.BLOCK_AFTER_HOURS * 3600000;

        const updated = bets.map(bet => {
            const isUnsynced = bet.status === 'pending' || bet.status === 'error';
            const isTooOld = (currentTime - bet.timestamp) > timeout;

            if (isUnsynced && isTooOld) {
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
     * Las apuestas pendientes antiguas se eliminan para mantener el sistema limpio.
     */
    midnightReset: () => (bets: BetDomainModel[]) => {
        const toKeep = bets.filter(bet =>
            bet.status === 'synced' || bet.status === 'blocked'
        );

        return {
            updated: toKeep,
            changes: bets.length - toKeep.length
        };
    }
};
