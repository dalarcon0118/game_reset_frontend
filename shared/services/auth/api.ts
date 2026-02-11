import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { BackendLoginResponse, User } from './types';
import { BackendLoginResponseCodec, decodeOrFallback } from './codecs';

export const AuthApi = {
  login: async (username: string, password: string): Promise<BackendLoginResponse> => {
    const response = await apiClient.post<any>(settings.api.endpoints.login(), { username, password });
    return decodeOrFallback(BackendLoginResponseCodec, response, 'login') as BackendLoginResponse;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(settings.api.endpoints.logout(), {}, { skipAuthHandler: true });
  },

  getMe: async (): Promise<User> => {
    return await apiClient.get<User>(settings.api.endpoints.me());
  }
};
