import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { IDeviceRepository } from './device.ports';
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
 */
class DeviceRepositoryImpl implements IDeviceRepository {
    private cachedId: string | null = null;

    async getUniqueId(): Promise<string> {
        if (this.cachedId) return this.cachedId;

        // 1. Intentar recuperar de cualquier fuente (Secure o AsyncStorage)
        let deviceId = await this.getStoredId();

        if (!deviceId) {
            log.info('No device identity found. Generating new permanent UUID...');
            deviceId = Crypto.randomUUID();
            // 2. Persistencia en ambas fuentes para resiliencia
            await this.storeId(deviceId);
        }

        this.cachedId = deviceId;
        return deviceId;
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
            await SecureStore.setItemAsync(DEVICE_IDENTITY_KEY, cachedId, DEVICE_SECURE_OPTIONS);
        }

        return securedId || cachedId;
    }

    private async storeId(id: string): Promise<void> {
        if (isWeb) {
            localStorage.setItem(DEVICE_IDENTITY_KEY, id);
        } else {
            // Guardar en ambas fuentes (SSoT Multinivel)
            await SecureStore.setItemAsync(DEVICE_IDENTITY_KEY, id, DEVICE_SECURE_OPTIONS);
            await storageClient.set(DEVICE_IDENTITY_KEY, id);
        }
    }
}

export const deviceRepository: IDeviceRepository = new DeviceRepositoryImpl();
