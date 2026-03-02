import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthOfflineKeys } from '../auth.keys';
import { IAuthStorage } from '../auth.ports';
import { AuthResult, AuthSession, User, AuthErrorType } from '../types/types';
import { hashString } from '../../../utils/crypto';
import { logger } from '../../../utils/logger';
import { offlineStorage } from '../../../core/offline-storage/instance';
import storageClient from '../../../core/offline-storage/storage_client';

const log = logger.withTag('AUTH_STORAGE_ADAPTER');
const isWeb = Platform.OS === 'web';

const SECURE_KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
};

async function setSecureItem(key: string, value: string) {
    if (isWeb) {
        await storageClient.set(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
}

async function getSecureItem(key: string) {
    if (isWeb) {
        return await storageClient.get<string>(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
}

async function deleteSecureItem(key: string) {
    if (isWeb) {
        await storageClient.remove(key);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
}

export const authStorageAdapter: IAuthStorage = {
    async saveSession(session: AuthSession): Promise<void> {
        try {
            await setSecureItem(SECURE_KEYS.ACCESS_TOKEN, session.accessToken);
            if (session.refreshToken) {
                await setSecureItem(SECURE_KEYS.REFRESH_TOKEN, session.refreshToken);
            }
            await offlineStorage.set(AuthOfflineKeys.userProfile(), session.user);
            log.info('Session persisted successfully');
        } catch (error) {
            log.error('Error persisting session', error);
            throw error;
        }
    },

    async getSession(): Promise<{ access: string | null; refresh: string | null }> {
        try {
            const access = await getSecureItem(SECURE_KEYS.ACCESS_TOKEN);
            const refresh = await getSecureItem(SECURE_KEYS.REFRESH_TOKEN);
            return { access, refresh };
        } catch (error) {
            log.error('Error reading session', error);
            return { access: null, refresh: null };
        }
    },

    async clearSession(): Promise<void> {
        try {
            await deleteSecureItem(SECURE_KEYS.ACCESS_TOKEN);
            await deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN);
            await offlineStorage.remove(AuthOfflineKeys.userProfile());
            log.info('Session cleared');
        } catch (error) {
            log.error('Error clearing session', error);
            throw error;
        }
    },

    async saveOfflineCredentials(username: string, pin: string, profile: User): Promise<void> {
        try {
            const pinHash = await hashString(pin);
            await offlineStorage.set(AuthOfflineKeys.pinHash(), pinHash);
            await offlineStorage.set(AuthOfflineKeys.lastUsername(), username);
            await offlineStorage.set(AuthOfflineKeys.userProfile(), profile);
            log.info('Offline credentials updated', { username });
        } catch (error) {
            log.error('Failed to save offline credentials', error);
        }
    },

    async validateOffline(username: string, pin: string): Promise<AuthResult> {
        try {
            const lastUser = await this.getLastUsername();
            const savedHash = await offlineStorage.get<string>(AuthOfflineKeys.pinHash());
            const profile = await this.getUserProfile();
            const currentHash = await hashString(pin);

            if (username === lastUser && currentHash === savedHash && profile) {
                log.info('Offline validation successful', { username });
                return {
                    success: true,
                    data: {
                        user: profile,
                        accessToken: 'offline-token',
                        isOffline: true
                    }
                };
            }

            log.warn('Offline validation failed', {
                matchUser: username === lastUser,
                hasHash: !!savedHash,
                hasProfile: !!profile
            });

            return {
                success: false,
                error: {
                    type: AuthErrorType.INVALID_CREDENTIALS,
                    message: 'Credenciales inválidas o no disponibles offline'
                }
            };
        } catch (error) {
            log.error('Error during offline validation', error);
            return {
                success: false,
                error: {
                    type: AuthErrorType.UNKNOWN_ERROR,
                    message: 'Error en la validación local'
                }
            };
        }
    },

    async saveLastUsername(username: string): Promise<void> {
        await offlineStorage.set(AuthOfflineKeys.lastUsername(), username);
    },

    async getLastUsername(): Promise<string | null> {
        return await offlineStorage.get<string>(AuthOfflineKeys.lastUsername());
    },

    async getUserProfile(): Promise<User | null> {
        return await offlineStorage.get<User>(AuthOfflineKeys.userProfile());
    }
};
