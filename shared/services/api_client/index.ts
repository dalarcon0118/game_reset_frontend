import { TokenStoragePort, IAuthRepository, ISettings, ILogger } from './api_client.types';
import { ApiClient } from './api_client';

export { ApiClient };
export * from './api_client.types';
export * from './api_client.errors';

let _tokenStorage: TokenStoragePort | null = null;

/**
 * Global configuration helper for the API Client.
 * Injected from the core module during bootstrap.
 */
export const setAuthRepository = (repo: IAuthRepository) => {
    _tokenStorage = repo;
};

export const apiClient = new ApiClient(
    () => {
        if (!_tokenStorage) {
            throw new Error('TokenStorage accessed before initialization');
        }
        return _tokenStorage;
    }
);

export default apiClient;
