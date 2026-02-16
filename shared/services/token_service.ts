import { TokenApi } from './token/api';
import { logger } from '../utils/logger';

const log = logger.withTag('TOKEN_SERVICE');

/**
 * TokenService handles secure storage of authentication tokens and user preferences.
 */
export const TokenService = {
    async saveToken(token: string, refresh?: string): Promise<void> {
        try {
            await TokenApi.saveToken(token, refresh);
        } catch (error) {
            log.error('Error saving token', error);
            throw error;
        }
    },

    async getToken(): Promise<{ access: string | null; refresh: string | null }> {
        try {
            return await TokenApi.getToken();
        } catch (error) {
            log.error('Error reading token', error);
            return { access: null, refresh: null };
        }
    },

    async clearToken(): Promise<void> {
        try {
            await TokenApi.clearToken();
        } catch (error) {
            log.error('Error clearing token', error);
            throw error;
        }
    },

    async saveUserProfile(user: any): Promise<void> {
        try {
            await TokenApi.saveUserProfile(user);
        } catch (error) {
            log.error('Error saving user profile', error);
        }
    },

    async getUserProfile(): Promise<any | null> {
        try {
            return await TokenApi.getUserProfile();
        } catch (error) {
            log.error('Error reading user profile', error);
            return null;
        }
    },

    async saveUserPinHash(hash: string): Promise<void> {
        try {
            await TokenApi.saveUserPinHash(hash);
        } catch (error) {
            log.error('Error saving PIN hash', error);
        }
    },

    async getUserPinHash(): Promise<string | null> {
        try {
            return await TokenApi.getUserPinHash();
        } catch (error) {
            log.error('Error reading PIN hash', error);
            return null;
        }
    },

    async saveLastUsername(username: string): Promise<void> {
        try {
            await TokenApi.saveLastUsername(username);
        } catch (error) {
            log.error('Error saving username', error);
            throw error;
        }
    },

    async getLastUsername(): Promise<string | null> {
        try {
            return await TokenApi.getLastUsername();
        } catch (error) {
            log.error('Error reading username', error);
            return null;
        }
    },

    async clearAll(): Promise<void> {
        try {
            await TokenApi.clearAll();
        } catch (error) {
            log.error('Error clearing auth data', error);
            throw error;
        }
    }
};
