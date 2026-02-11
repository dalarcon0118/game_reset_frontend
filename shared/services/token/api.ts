import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_access_token';
const LAST_USER_KEY = 'auth_last_username';

export const TokenApi = {
    async saveToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    },

    async getToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    },

    async clearToken(): Promise<void> {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    },

    async saveLastUsername(username: string): Promise<void> {
        await SecureStore.setItemAsync(LAST_USER_KEY, username);
    },

    async getLastUsername(): Promise<string | null> {
        return await SecureStore.getItemAsync(LAST_USER_KEY);
    },

    async clearAll(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(TOKEN_KEY),
            SecureStore.deleteItemAsync(LAST_USER_KEY)
        ]);
    }
};
