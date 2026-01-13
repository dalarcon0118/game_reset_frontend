import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_access_token';
const LAST_USER_KEY = 'auth_last_username';

/**
 * TokenService handles secure storage of authentication tokens and user preferences.
 * Uses expo-secure-store for encrypted storage on device.
 */
export const TokenService = {
    /**
     * Save authentication token securely
     */
    async saveToken(token: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving token to SecureStore:', error);
            throw error;
        }
    },

    /**
     * Retrieve authentication token
     */
    async getToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error('Error reading token from SecureStore:', error);
            return null;
        }
    },

    /**
     * Remove authentication token
     */
    async clearToken(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error('Error clearing token from SecureStore:', error);
            throw error;
        }
    },

    /**
     * Save last logged in username for convenience
     */
    async saveLastUsername(username: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(LAST_USER_KEY, username);
        } catch (error) {
            console.error('Error saving username to SecureStore:', error);
            throw error;
        }
    },

    /**
     * Retrieve last logged in username
     */
    async getLastUsername(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(LAST_USER_KEY);
        } catch (error) {
            console.error('Error reading username from SecureStore:', error);
            return null;
        }
    },

    /**
     * Clear all stored authentication data
     */
    async clearAll(): Promise<void> {
        try {
            await Promise.all([
                SecureStore.deleteItemAsync(TOKEN_KEY),
                SecureStore.deleteItemAsync(LAST_USER_KEY)
            ]);
        } catch (error) {
            console.error('Error clearing auth data from SecureStore:', error);
            throw error;
        }
    }
};
