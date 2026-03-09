import { OfflineStorageKeyManager } from '@/shared/core/offline-storage/utils';

/**
 * Helpers para la generación de llaves de almacenamiento offline del dominio de Sorteos (Draws).
 * Mantiene el core de storage agnóstico al centralizar aquí el conocimiento del negocio.
 */
export const DrawOfflineKeys = {
    /**
     * Llave para los datos de un sorteo individual
     */
    draw: (id: string, subresource: 'data' | 'financial' | 'results' = 'data') => 
        OfflineStorageKeyManager.generateKey('draw', 'instance', id, subresource),

    /**
     * Llave para la lista completa de sorteos (caché rápida)
     * Puede ser segmentada por estructura o global (legacy)
     */
    drawList: (structureId?: string | number) => 
        structureId 
            ? OfflineStorageKeyManager.generateKey('draw', 'instance', `list:${structureId}`, 'data')
            : OfflineStorageKeyManager.generateKey('draw', 'instance', 'list', 'data'),

    /**
     * Llave para los tipos de apuesta de un sorteo
     */
    betType: (drawId: string, subresource: string = 'list') => 
        OfflineStorageKeyManager.generateKey('draw', 'bet_type', drawId, subresource),

    /**
     * Patrón para buscar sorteos
     */
    getPattern: (entity: string = 'instance', id: string = '*', subresource: string = 'data') =>
        OfflineStorageKeyManager.getPattern('draw', entity, id, subresource),
};
