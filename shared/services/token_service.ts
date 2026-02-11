import { TokenApi } from './token/api';

/**
 * TokenService handles secure storage of authentication tokens and user preferences.
 */
export const TokenService = {
    async saveToken(token: string): Promise<void> {
        try {
            await TokenApi.saveToken(token);
        } catch (error) {
            console.error('Error saving token:', error);
            throw error;
        }
    },

    async getToken(): Promise<string | null> {
        try {
            return await TokenApi.getToken();
        } catch (error) {
            console.error('Error reading token:', error);
            return null;
        }
    },

    async clearToken(): Promise<void> {
        try {
            await TokenApi.clearToken();
        } catch (error) {
            console.error('Error clearing token:', error);
            throw error;
        }
    },

    async saveLastUsername(username: string): Promise<void> {
        try {
            await TokenApi.saveLastUsername(username);
        } catch (error) {
            console.error('Error saving username:', error);
            throw error;
        }
    },

    async getLastUsername(): Promise<string | null> {
        try {
            return await TokenApi.getLastUsername();
        } catch (error) {
            console.error('Error reading username:', error);
            return null;
        }
    },

    async clearAll(): Promise<void> {
        try {
            await TokenApi.clearAll();
        } catch (error) {
            console.error('Error clearing auth data:', error);
            throw error;
        }
    }
};
