import { apiClient } from '../../../services/api_client';
import { settings } from '../../../../config/settings';
import { logger } from '../../../utils/logger';
import { BackendLoginResponseCodec, decodeOrFallback } from '../codecs/codecs';
import { BackendLoginResponse, User } from '../types/types';
import { AUTH_LOG_TAGS, AUTH_LOGS } from '../auth.constants';

const log = logger.withTag(AUTH_LOG_TAGS.API_V2);

export const AuthApi = {
  login: async (username: string, pin: string): Promise<BackendLoginResponse> => {
    // Mapear pin a password para compatibilidad con Django REST framework simplejwt
    const response = await apiClient.post<any>(settings.api.endpoints.login(), { username, password: pin });

    // Validar la respuesta con io-ts
    const validatedResponse = decodeOrFallback(BackendLoginResponseCodec, response, 'login');

    // Log para debugging si la validación falla
    if (validatedResponse !== response) {
      log.warn(AUTH_LOGS.VALIDATION_FAILED, { original: response, validated: validatedResponse });
    }

    return validatedResponse as BackendLoginResponse;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(settings.api.endpoints.logout(), {}, { skipAuthHandler: true });
  },

  getMe: async (): Promise<User> => {
    return await apiClient.get<User>(settings.api.endpoints.me());
  },

  refresh: async (refreshToken: string): Promise<BackendLoginResponse> => {
    const response = await apiClient.post<any>(settings.api.endpoints.refresh(), { refresh: refreshToken }, { skipAuthHandler: true });

    // Validar la respuesta con io-ts (mismo codec que login ya que retorna tokens)
    const validatedResponse = decodeOrFallback(BackendLoginResponseCodec, response, 'refresh');

    if (validatedResponse !== response) {
      log.warn(AUTH_LOGS.VALIDATION_FAILED, { original: response, validated: validatedResponse });
    }

    return validatedResponse as BackendLoginResponse;
  }
};
