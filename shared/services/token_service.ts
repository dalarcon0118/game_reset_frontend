import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

const log = logger.withTag('TOKEN_SERVICE');

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  PIN_HASH: 'auth_pin_hash',
  USER_PROFILE: 'user_profile',
  LAST_USERNAME: 'last_username',
};

const isWeb = Platform.OS === 'web';

async function setSecureItem(key: string, value: string) {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getSecureItem(key: string) {
  if (isWeb) {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

async function deleteSecureItem(key: string) {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

/**
 * TokenService handles secure storage of authentication tokens and user preferences.
 * Refactored to eliminate dependency on TokenApi and direct usage of storage drivers.
 */
export const TokenService = {
    async saveToken(token: string, refresh?: string): Promise<void> {
        try {
            await setSecureItem(KEYS.ACCESS_TOKEN, token);
            if (refresh) {
                await setSecureItem(KEYS.REFRESH_TOKEN, refresh);
            }
        } catch (error) {
            log.error('Error saving token', error);
            throw error;
        }
    },

    async getToken(): Promise<{ access: string | null; refresh: string | null }> {
        try {
            const access = await getSecureItem(KEYS.ACCESS_TOKEN);
            const refresh = await getSecureItem(KEYS.REFRESH_TOKEN);
            return { access, refresh };
        } catch (error) {
            log.error('Error reading token', error);
            return { access: null, refresh: null };
        }
    },

    async clearToken(): Promise<void> {
        try {
            await deleteSecureItem(KEYS.ACCESS_TOKEN);
            await deleteSecureItem(KEYS.REFRESH_TOKEN);
        } catch (error) {
            log.error('Error clearing token', error);
            throw error;
        }
    },

    async saveUserProfile(user: any): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
        } catch (error) {
            log.error('Error saving user profile', error);
        }
    },

    async getUserProfile(): Promise<any | null> {
        try {
            const json = await AsyncStorage.getItem(KEYS.USER_PROFILE);
            return json ? JSON.parse(json) : null;
        } catch (error) {
            log.error('Error reading user profile', error);
            return null;
        }
    },

    async saveUserPinHash(hash: string): Promise<void> {
        try {
            await setSecureItem(KEYS.PIN_HASH, hash);
        } catch (error) {
            log.error('Error saving PIN hash', error);
        }
    },

    async getUserPinHash(): Promise<string | null> {
        try {
            return await getSecureItem(KEYS.PIN_HASH);
        } catch (error) {
            log.error('Error reading PIN hash', error);
            return null;
        }
    },

    async saveLastUsername(username: string): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.LAST_USERNAME, username);
        } catch (error) {
            log.error('Error saving username', error);
            throw error;
        }
    },

    async getLastUsername(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(KEYS.LAST_USERNAME);
        } catch (error) {
            log.error('Error reading username', error);
            return null;
        }
    },

    async clearAll(): Promise<void> {
        try {
            await this.clearToken();
            await deleteSecureItem(KEYS.PIN_HASH);
            await AsyncStorage.removeItem(KEYS.USER_PROFILE);
            // Note: We might want to keep last username depending on requirements,
            // but clearAll usually means full wipe.
            await AsyncStorage.removeItem(KEYS.LAST_USERNAME); 
        } catch (error) {
            log.error('Error clearing auth data', error);
            throw error;
        }
    }
};
