import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { IDeviceRepository, setDeviceIdBackup, getDeviceIdBackup } from './device.ports';
import { logger } from '../../../utils/logger';
import storageClient from '../../../core/offline-storage/storage_client';

const log = logger.withTag('DEVICE_REPOSITORY');
const DEVICE_IDENTITY_KEY = 'system_device_unique_identity';
const isWeb = Platform.OS === 'web';
const DEVICE_SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
    keychainService: 'game_reset_device_id',
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * DeviceRepositoryImpl - Gestiona la identidad física persistente del dispositivo.
 * Utiliza SecureStore para garantizar que el ID sobreviva a reinicios y, en iOS,
 * a reinstalaciones parciales (Keychain).
 * 
 * SECUENCIA DE FALLBACK OPTIMIZADA:
 * 1. Cache en memoria (más rápido) - this.cachedId
 * 2. Memory Backup (síncrono, instantáneo) - _deviceIdBackup global
 * 3. SecureStorage + AsyncStorage (con reintentos)
 * 4. Generar nuevo UUID (último recurso solo si todo falla)
 */
class DeviceRepositoryImpl implements IDeviceRepository {
    private cachedId: string | null = null;
    private readonly MAX_STORAGE_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 100;

    async getUniqueId(): Promise<string> {
        // 1. Cache en memoria (más rápido)
        if (this.cachedId) {
            log.debug('[DeviceRepository] ✅ Returning cached device ID');
            return this.cachedId;
        }

        // 2. Memory Backup (síncrono, instantáneo - sin await!)
        const memoryBackup = getDeviceIdBackup();
        if (memoryBackup) {
            log.info('[DeviceRepository] 🔄 Using memory backup for device ID (instant)');
            this.cachedId = memoryBackup;
            return memoryBackup;
        }

        // 3. Storage con reintentos (caso típico: app fría o storage corrupto)
        log.debug('[DeviceRepository] 🔍 Checking storage for device ID...');
        let deviceId = await this.getStoredIdWithRetry();

        if (!deviceId) {
            log.warn('[DeviceRepository] ⚠️ No device identity found in storage. This should be rare!');
            log.warn('[DeviceRepository] 🔧 Generating new device ID as last resort');
            deviceId = Crypto.randomUUID();
            await this.storeId(deviceId);
        }

        // Guardar en todos los niveles para máxima resiliencia
        this.cachedId = deviceId;
        setDeviceIdBackup(deviceId); // Backup de memoria para acceso instantáneo
        
        log.info('[DeviceRepository] ✅ Device ID ready', { 
            cachedId: this.cachedId,
            source: deviceId ? 'storage' : 'generated'
        });
        return deviceId;
    }

    /**
     * Obtiene el device ID de forma síncrona desde el memory backup.
     * NO genera nuevo ID, solo retorna el backup si existe.
     * Útil para situaciones donde se necesita el ID inmediatamente sin await.
     */
    getUniqueIdSync(): string | null {
        // 1. Primero cache en memoria (síncrono)
        if (this.cachedId) {
            return this.cachedId;
        }
        // 2. Segundo, memory backup global
        return getDeviceIdBackup();
    }

    private async getStoredIdWithRetry(): Promise<string | null> {
        for (let attempt = 0; attempt < this.MAX_STORAGE_RETRIES; attempt++) {
            const deviceId = await this.getStoredId();
            if (deviceId) {
                if (attempt > 0) {
                    log.info(`[DeviceRepository] Device ID recovered after ${attempt + 1} attempt(s)`);
                }
                return deviceId;
            }
            
            if (attempt < this.MAX_STORAGE_RETRIES - 1) {
                const delay = this.RETRY_DELAY_MS * (attempt + 1);
                log.debug(`[DeviceRepository] Storage read attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        
        log.warn('[DeviceRepository] All storage read attempts failed');
        return null;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fuerza la invalidación del cache en memoria.
     * Útil cuando se detecta que el cache puede estar corrupto tras volver del segundo plano.
     */
    invalidateCache(): void {
        log.debug('[DeviceRepository] Cache invalidated');
        this.cachedId = null;
    }

    /**
     * Obtiene el ID actual sin usar cache (lectura directa del storage).
     * Útil para diagnóstico o verificación de consistencia.
     */
    async getUniqueIdDirect(): Promise<string | null> {
        return this.getStoredId();
    }

    async resetIdentity(): Promise<void> {
        try {
            if (isWeb) {
                localStorage.removeItem(DEVICE_IDENTITY_KEY);
            } else {
                await SecureStore.deleteItemAsync(DEVICE_IDENTITY_KEY, DEVICE_SECURE_OPTIONS);
                await storageClient.remove(DEVICE_IDENTITY_KEY);
            }
            this.cachedId = null;
            // ⚠️ IMPORTANTE: También limpiar el memory backup global
            setDeviceIdBackup('');
            log.warn('Device identity has been reset across all stores');
        } catch (error) {
            log.error('Failed to reset device identity', error);
        }
    }

    private async getStoredId(): Promise<string | null> {
        if (isWeb) {
            return localStorage.getItem(DEVICE_IDENTITY_KEY);
        }

        // Nivel 1: SecureStore (Seguridad Máxima)
        const securedId = await SecureStore.getItemAsync(DEVICE_IDENTITY_KEY, DEVICE_SECURE_OPTIONS);

        // Nivel 2: AsyncStorage via storageClient (Resiliencia)
        const cachedId = await storageClient.get<string>(DEVICE_IDENTITY_KEY);

        // Reconciliación: Si falta en uno pero está en otro, sincronizar
        if (securedId && !cachedId) {
            log.debug('Restoring DeviceID to AsyncStorage cache');
            await storageClient.set(DEVICE_IDENTITY_KEY, securedId);
        }

        if (!securedId && cachedId) {
            log.debug('Restoring DeviceID to SecureStore from cache');
            const stringId = typeof cachedId === 'string' ? cachedId : String(cachedId ?? '');
            await SecureStore.setItemAsync(DEVICE_IDENTITY_KEY, stringId, DEVICE_SECURE_OPTIONS);
        }

        return securedId || cachedId;
    }

    private async storeId(id: string): Promise<void> {
        if (isWeb) {
            localStorage.setItem(DEVICE_IDENTITY_KEY, id);
        } else {
            // Guardar en ambas fuentes (SSoT Multinivel)
            // Defensive check: Ensure id is a string
            const stringId = typeof id === 'string' ? id : String(id ?? '');
            await SecureStore.setItemAsync(DEVICE_IDENTITY_KEY, stringId, DEVICE_SECURE_OPTIONS);
            await storageClient.set(DEVICE_IDENTITY_KEY, id);
        }
    }
}

export const deviceRepository: IDeviceRepository = new DeviceRepositoryImpl();
