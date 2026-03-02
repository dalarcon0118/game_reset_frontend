import apiClient from '../../../services/api_client';
import settings from '../../../../config/settings';
import { logger } from '../../../utils/logger';
import { BackendLoginResponseCodec, decodeOrFallback } from '../codecs/codecs';
import { BackendLoginResponse, User } from '../types/types';

const log = logger.withTag('AUTH_API_V2');

export const AuthApi = {
  login: async (username: string, pin: string): Promise<BackendLoginResponse> => {
    // Mapear pin a password para compatibilidad con Django REST framework simplejwt
    const response = await apiClient.post<any>(settings.api.endpoints.login(), { username, password: pin });
    
    // Validar la respuesta con io-ts
    const validatedResponse = decodeOrFallback(BackendLoginResponseCodec, response, 'login');
    
    // Log para debugging si la validación falla
    if (validatedResponse !== response) {
      log.warn('Login response validation failed', { original: response, validated: validatedResponse });
    }
    
    return validatedResponse as BackendLoginResponse;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(settings.api.endpoints.logout(), {}, { skipAuthHandler: true });
  },

  getMe: async (): Promise<User> => {
    return await apiClient.get<User>(settings.api.endpoints.me());
  }
};
