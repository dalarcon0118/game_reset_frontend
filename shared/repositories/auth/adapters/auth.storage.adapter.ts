import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthOfflineKeys } from '../auth.keys';
import { IAuthStorage } from '../auth.ports';
import { AuthResult, AuthSession, User, AuthErrorType, isValidUser } from '../types/types';
import { hashString } from '../../../utils/crypto';
import { logger } from '../../../utils/logger';
import { offlineStorage } from '../../../core/offline-storage/instance';
import { STORAGE_TTL } from '@core/offline-storage/types';
import storageClient from '@core/offline-storage/storage_client';
import { AUTH_KEYS, AUTH_LOG_TAGS, AUTH_LOGS } from '../auth.constants';

const log = logger.withTag(AUTH_LOG_TAGS.STORAGE_ADAPTER);
const isWeb = Platform.OS === 'web';

const SECURE_KEYS = {
    ACCESS_TOKEN: AUTH_KEYS.SECURE_ACCESS_TOKEN,
    REFRESH_TOKEN: AUTH_KEYS.SECURE_REFRESH_TOKEN,
    CONFIRMATION_TOKEN: AUTH_KEYS.SECURE_CONFIRMATION_TOKEN,
    DAILY_SECRET: AUTH_KEYS.SECURE_DAILY_SECRET,
    TIME_ANCHOR: 'auth_time_anchor',
};

async function setSecureItem(key: string, value: string) {
    if (isWeb) {
        await storageClient.set(key, value);
    } else {
        // Defensive check: Ensure value is a string before calling SecureStore
        // This prevents "Invalid value provided to SecureStore" errors
        const stringValue = typeof value === 'string' ? value : String(value ?? '');
        await SecureStore.setItemAsync(key, stringValue);
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
            if (session.confirmationToken) {
                await setSecureItem(SECURE_KEYS.CONFIRMATION_TOKEN, session.confirmationToken);
            }
            if (session.dailySecret) {
                await setSecureItem(SECURE_KEYS.DAILY_SECRET, session.dailySecret);
            }
            if (session.timeAnchor) {
                await setSecureItem(SECURE_KEYS.TIME_ANCHOR, JSON.stringify(session.timeAnchor));
            }
            // Guardar perfil con TTL - se renovará en cada login
            await offlineStorage.set(AuthOfflineKeys.userProfile(), session.user, { ttl: STORAGE_TTL.USER_PROFILE });
            log.info(AUTH_LOGS.SESSION_PERSISTED);
        } catch (error) {
            log.error(AUTH_LOGS.SESSION_PERSIST_ERROR, error);
            throw error;
        }
    },

    async getSession(): Promise<{ access: string | null; refresh: string | null; confirmationToken?: string | null; dailySecret?: string | null; timeAnchor?: any | null; isOffline?: boolean }> {
        try {
            const access = await getSecureItem(SECURE_KEYS.ACCESS_TOKEN);
            const refresh = await getSecureItem(SECURE_KEYS.REFRESH_TOKEN);
            const confirmationToken = await getSecureItem(SECURE_KEYS.CONFIRMATION_TOKEN);
            const dailySecret = await getSecureItem(SECURE_KEYS.DAILY_SECRET);
            const timeAnchorStr = await getSecureItem(SECURE_KEYS.TIME_ANCHOR);
            const timeAnchor = timeAnchorStr ? JSON.parse(timeAnchorStr) : null;

            // Verificar si es una sesión offline
            const isOffline = access === AUTH_KEYS.SECURE_OFFLINE_TOKEN;

            return { access, refresh, confirmationToken, dailySecret, timeAnchor, isOffline };
        } catch (error) {
            log.error(AUTH_LOGS.SESSION_READ_ERROR, error);
            return { access: null, refresh: null, confirmationToken: null, dailySecret: null, timeAnchor: null, isOffline: false };
        }
    },

    async clearSession(): Promise<void> {
        try {
            await deleteSecureItem(SECURE_KEYS.ACCESS_TOKEN);
            await deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN);
            await deleteSecureItem(SECURE_KEYS.CONFIRMATION_TOKEN);
            await deleteSecureItem(SECURE_KEYS.DAILY_SECRET);
            await deleteSecureItem(SECURE_KEYS.TIME_ANCHOR);
            await offlineStorage.remove(AuthOfflineKeys.userProfile());
            log.info(AUTH_LOGS.SESSION_CLEARED);
        } catch (error) {
            log.error(AUTH_LOGS.SESSION_CLEAR_ERROR, error);
            throw error;
        }
    },

    async saveOfflineCredentials(username: string, pin: string, profile: User): Promise<void> {
        try {
            const pinHash = await hashString(pin);
            await offlineStorage.set(AuthOfflineKeys.pinHash(), pinHash);
            await offlineStorage.set(AuthOfflineKeys.lastUsername(), username);
            await offlineStorage.set(AuthOfflineKeys.offlineProfile(), profile);
            log.info(AUTH_LOGS.OFFLINE_CREDENTIALS_UPDATED, { username });
        } catch (error) {
            log.error(AUTH_LOGS.OFFLINE_CREDENTIALS_ERROR, error);
        }
    },

    async validateOffline(username: string, pin: string): Promise<AuthResult> {
        try {
            const lastUser = await this.getLastUsername();
            const savedHash = await offlineStorage.get<string>(AuthOfflineKeys.pinHash());
            const offlineProfile = await offlineStorage.get<User>(AuthOfflineKeys.offlineProfile());
            const activeSessionProfile = await this.getUserProfile();
            const profile = offlineProfile ?? activeSessionProfile;
            const currentHash = await hashString(pin);

            // Normalización para evitar fallos por mayúsculas o espacios accidentales
            const normalizedInput = username.trim().toLowerCase();
            const normalizedStored = lastUser?.trim().toLowerCase();

            if (normalizedInput === normalizedStored && currentHash === savedHash && profile) {
                log.info(AUTH_LOGS.OFFLINE_VAL_SUCCESS, { username });
                return {
                    success: true,
                    data: {
                        user: profile,
                        accessToken: AUTH_KEYS.SECURE_OFFLINE_TOKEN,
                        isOffline: true
                    }
                };
            }

            log.warn(AUTH_LOGS.OFFLINE_VAL_FAILED, {
                matchUser: username === lastUser,
                hasHash: !!savedHash,
                hasProfile: !!profile
            });

            return {
                success: false,
                error: {
                    type: AuthErrorType.INVALID_CREDENTIALS,
                    message: AUTH_LOGS.OFFLINE_VAL_INVALID
                }
            };
        } catch (error) {
            log.error(AUTH_LOGS.OFFLINE_VAL_ERROR, error);
            return {
                success: false,
                error: {
                    type: AuthErrorType.UNKNOWN_ERROR,
                    message: AUTH_LOGS.OFFLINE_VAL_LOCAL_ERROR
                }
            };
        }
    },

    async saveLastUsername(username: string): Promise<void> {
        await offlineStorage.set(AuthOfflineKeys.lastUsername(), username);
    },

    async getLastUsername(): Promise<string | null> {
        const lastUser = await offlineStorage.get<string>(AuthOfflineKeys.lastUsername());
        log.debug(AUTH_LOGS.CHECKING_LAST_USER, { lastUser });
        if (lastUser) return lastUser;

        // Fallback al perfil offline si no hay last_username
        const profile = await this.getOfflineProfile();
        log.debug(AUTH_LOGS.FALLBACK_OFFLINE_PROFILE, { profileFound: !!profile, username: profile?.username });
        return profile?.username || null;
    },

    async getUserProfile(): Promise<User | null> {
        const profile = await offlineStorage.get<User>(AuthOfflineKeys.userProfile());
        // DEFENSIVO: Validar que el perfil tenga campos requeridos
        if (!isValidUser(profile)) {
            if (profile !== null) {
                log.warn('getUserProfile: Returning null for invalid profile', {
                    profileType: typeof profile,
                    hasId: !!(profile as any)?.id,
                    hasUsername: !!(profile as any)?.username,
                    profileKeys: profile ? Object.keys(profile) : null
                });
            }
            return null;
        }
        return profile;
    },

    async getOfflineProfile(): Promise<User | null> {
        const profile = await offlineStorage.get<User>(AuthOfflineKeys.offlineProfile());
        // DEFENSIVO: Validar que el perfil tenga campos requeridos
        if (!isValidUser(profile)) {
            return null;
        }
        return profile;
    },
    async saveLastLoginDate(date: string): Promise<void> {
        await offlineStorage.set(AuthOfflineKeys.lastLoginDate(), date);
    },
    async getLastLoginDate(): Promise<string | null> {
        return await offlineStorage.get<string>(AuthOfflineKeys.lastLoginDate());
    },
    async purgeLegacyData(): Promise<void> {
        try {
            await deleteSecureItem(AUTH_KEYS.LEGACY_DEVICE_ID);
            log.info(AUTH_LOGS.PURGE_LEGACY_DATA);
        } catch (error) {
            log.warn(AUTH_LOGS.PURGE_LEGACY_ERROR, error);
        }
    }
};
