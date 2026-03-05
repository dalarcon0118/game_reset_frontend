import { OfflineStorageKeyManager } from '@/shared/core/offline-storage/utils';

/**
 * Helpers para la generación de llaves de almacenamiento offline del dominio de Apuestas (Bets).
 * Mantiene el core de storage agnóstico al centralizar aquí el conocimiento del negocio.
 */
export const BetOfflineKeys = {
    /**
     * Llave para los datos de una apuesta pendiente
     */
    bet: (id: string) =>
        OfflineStorageKeyManager.generateKey('bet', 'pending', id, 'data'),

    /**
     * Patrón para buscar todas las apuestas
     */
    getPattern: (entity: string = 'pending', id: string = '*') =>
        OfflineStorageKeyManager.getPattern('bet', entity, id, 'data'),
};
