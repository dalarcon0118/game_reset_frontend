import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const LAST_USER_KEY = 'auth_last_username';
const USER_PROFILE_KEY = 'auth_user_profile';
const USER_PIN_HASH_KEY = 'auth_user_pin_hash';

export const TokenApi = {
    async saveToken(token: string, refresh?: string): Promise<void> {
        const tasks = [SecureStore.setItemAsync(TOKEN_KEY, token)];
        if (refresh) {
            tasks.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh));
        }
        await Promise.all(tasks);
    },

    async getToken(): Promise<{ access: string | null; refresh: string | null }> {
        const [access, refresh] = await Promise.all([
            SecureStore.getItemAsync(TOKEN_KEY),
            SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
        ]);
        return { access, refresh };
    },

    async clearToken(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
        ]);
    },

    async saveUserProfile(user: any): Promise<void> {
        await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(user));
    },

    async getUserProfile(): Promise<any | null> {
        const data = await SecureStore.getItemAsync(USER_PROFILE_KEY);
        return data ? JSON.parse(data) : null;
    },

    async saveUserPinHash(hash: string): Promise<void> {
        await SecureStore.setItemAsync(USER_PIN_HASH_KEY, hash);
    },

    async getUserPinHash(): Promise<string | null> {
        return await SecureStore.getItemAsync(USER_PIN_HASH_KEY);
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
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
            SecureStore.deleteItemAsync(LAST_USER_KEY),
            SecureStore.deleteItemAsync(USER_PROFILE_KEY),
            SecureStore.deleteItemAsync(USER_PIN_HASH_KEY)
        ]);
    }
};
