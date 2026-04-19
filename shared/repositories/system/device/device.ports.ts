/**
 * Memory Backup para Device ID
 * Variable global que sobrevive a re-hydratations de la app y 
 * proporciona acceso síncrono instantáneo al deviceId.
 */
let _deviceIdBackup: string | null = null;

/**
 * Guarda el device ID en el backup de memoria.
 * Debe llamarse después de cada obtención exitosa del ID.
 */
export function setDeviceIdBackup(id: string): void {
    _deviceIdBackup = id;
}

/**
 * Obtiene el device ID del backup de memoria (síncrono, instantáneo).
 * Retorna null si no hay backup disponible.
 */
export function getDeviceIdBackup(): string | null {
    return _deviceIdBackup;
}

export interface IDeviceRepository {
    /**
     * Recupera el ID único del dispositivo o genera uno nuevo si no existe.
     * El ID se persiste en el almacenamiento seguro (Keychain/Keystore).
     * Implementa reintentos automáticos para manejar fallos de lectura al volver del segundo plano.
     * 
     * SECUENCIA DE FALLBACK:
     * 1. Cache en memoria (más rápido)
     * 2. Memory Backup (síncrono, instantáneo)
     * 3. SecureStorage (con reintentos)
     * 4. AsyncStorage (fallback)
     * 5. Generar nuevo UUID (último recurso)
     */
    getUniqueId(): Promise<string>;

    /**
     * Fuerza la invalidación del cache en memoria.
     * Útil cuando se detecta que el cache puede estar corrupto tras volver del segundo plano.
     */
    invalidateCache(): void;

    /**
     * Obtiene el ID actual sin usar cache (lectura directa del storage).
     * Útil para diagnóstico o verificación de consistencia.
     */
    getUniqueIdDirect(): Promise<string | null>;

    /**
     * Resetea la identidad del dispositivo (solo para propósitos de soporte/debug).
     */
    resetIdentity(): Promise<void>;
    
    /**
     * Obtiene el device ID de forma síncrona desde el memory backup.
     * Útil para situaciones donde se necesita el ID inmediatamente sin esperar async.
     * NO genera nuevo ID, solo retorna el backup si existe.
     */
    getUniqueIdSync(): string | null;
}
