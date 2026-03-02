import { OfflineStorageKeyManager } from '@/shared/core/offline-storage/utils';

/**
 * Helpers para la generación de llaves de almacenamiento offline para el sistema y finanzas.
 */
export const SystemOfflineKeys = {
    /**
     * Llave para el resumen financiero actual
     */
    summary: (id: string = 'current') => 
        OfflineStorageKeyManager.generateKey('system', 'summary', id, 'data'),

    /**
     * Llave para configuraciones del sistema (ej. mantenimiento)
     */
    config: (type: string, key: string) => 
        OfflineStorageKeyManager.generateKey('config', type, key, 'data'),

    /**
     * Llave para las reglas (validación o premios)
     */
    rules: (structureId: string, type: 'validation' | 'reward' = 'validation') => 
        OfflineStorageKeyManager.generateKey('rules', type, structureId, 'data'),
};
