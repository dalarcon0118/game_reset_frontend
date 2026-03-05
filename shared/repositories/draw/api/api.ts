import settings from '@/config/settings';
import { BackendDraw, DrawClosureConfirmation, BetType, DrawRule } from './types/types';
import {
  BackendDrawCodec,
  BackendDrawArrayCodec,
  DrawClosureConfirmationCodec,
  DrawClosureConfirmationArrayCodec,
  decodeOrFallback
} from './codecs/codecs';
import logger from '@/shared/utils/logger';
import apiClient from '@/shared/services/api_client';

const log = logger.withTag('DRAW_API');

const normalizeListResponse = <T>(response: any): T[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const DrawApi = {
  getOne: async (id: string | number): Promise<BackendDraw> => {
    if (!id) {
      log.warn('getOne called with empty id');
      throw new Error('getOne: id is required');
    }
    const response = await apiClient.get<BackendDraw>(`${settings.api.endpoints.draws()}${id}/`);
    return decodeOrFallback(BackendDrawCodec, response, `getOne(${id})`);
  },

  list: async (params: Record<string, any> = {}): Promise<BackendDraw[]> => {
    // Defensive check for apiClient
    if (!apiClient) {
      const error = new Error('DrawApi Error: apiClient is undefined. This suggests a module loading issue or circular dependency.');
      log.error('Critical Error: apiClient is undefined in DrawApi.list', error);
      throw error;
    }

    const queryParams = { ...params };
    if (queryParams.next24h) {
      queryParams.next_24h = queryParams.next24h;
      delete queryParams.next24h;
    }

    log.debug('<<< API CALL: GET draws', { queryParams });
    const response = await apiClient.get<any>(settings.api.endpoints.draws(), { queryParams });
    const data = normalizeListResponse<BackendDraw>(response);
    log.debug('<<< API CALL: GET draws data', JSON.stringify(data));

    return decodeOrFallback(BackendDrawArrayCodec, data, 'list');
  },

  getBetTypes: async (drawId: string | number): Promise<BetType[]> => {
    if (!drawId) {
      log.warn('getBetTypes called with empty drawId, skipping request');
      return [];
    }
    const endpoint = `${settings.api.endpoints.draws()}${drawId}/bet-types/`;
    return await apiClient.get<BetType[]>(endpoint);
  },

  getRulesForDraw: async (drawId: string | number): Promise<DrawRule[]> => {
    if (!drawId) {
      log.warn('getRulesForDraw called with empty drawId, skipping request');
      return [];
    }
    return await apiClient.get<DrawRule[]>(
      `${settings.api.endpoints.draws()}${drawId}/rules-for-current-user/`
    );
  },

  addWinningNumbers: async (drawId: string | number, data: { winning_number: string; date: string }): Promise<any> => {
    if (!drawId) throw new Error('addWinningNumbers: drawId is required');
    return await apiClient.post<any>(
      `${settings.api.endpoints.draws()}${drawId}/add-winning-numbers/`,
      data
    );
  },

  updateStatus: async (drawId: string | number, status: 'success' | 'reported'): Promise<void> => {
    if (!drawId) throw new Error('updateStatus: drawId is required');
    await apiClient.patch(
      `${settings.api.endpoints.draws()}${drawId}/`,
      { status_closed: status }
    );
  },

  getClosureConfirmationsByDraw: async (drawId: string | number): Promise<DrawClosureConfirmation[]> => {
    if (!drawId) return [];
    const response = await apiClient.get<DrawClosureConfirmation[]>(
      `${settings.api.endpoints.closureConfirmations()}by-draw/${drawId}/`
    );
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'getClosureConfirmationsByDraw');
  },

  createClosureConfirmationsForDraw: async (
    drawId: string | number,
    data?: { status?: string; notes?: string }
  ): Promise<DrawClosureConfirmation[]> => {
    if (!drawId) return [];
    const response = await apiClient.post<DrawClosureConfirmation[]>(
      `${settings.api.endpoints.closureConfirmations()}by-draw/${drawId}/`,
      data || {}
    );
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'createClosureConfirmationsForDraw');
  },

  confirmClosure: async (
    confirmationId: number,
    status: 'confirmed_success' | 'reported_issue' | 'rejected',
    notes: string
  ): Promise<DrawClosureConfirmation> => {
    if (!confirmationId) throw new Error('confirmClosure: confirmationId is required');
    const response = await apiClient.patch<DrawClosureConfirmation>(
      `${settings.api.endpoints.closureConfirmations()}${confirmationId}/`,
      { status, notes }
    );
    return decodeOrFallback(DrawClosureConfirmationCodec, response, 'confirmClosure');
  },

  getPendingClosureConfirmations: async (): Promise<DrawClosureConfirmation[]> => {
    const response = await apiClient.get<DrawClosureConfirmation[]>(
      `${settings.api.endpoints.closureConfirmations()}pending-for-user/`
    );
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'getPendingClosureConfirmations');
  },

  getClosureConfirmations: async (filters?: Record<string, any>): Promise<DrawClosureConfirmation[]> => {
    const response = await apiClient.get<DrawClosureConfirmation[]>(
      settings.api.endpoints.closureConfirmations(),
      { queryParams: filters }
    );
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'getClosureConfirmations');
  },

  updateClosureConfirmation: async (
    confirmationId: string | number,
    data: any
  ): Promise<DrawClosureConfirmation> => {
    const response = await apiClient.patch<DrawClosureConfirmation>(
      `${settings.api.endpoints.closureConfirmations()}${confirmationId}/`,
      data
    );
    return decodeOrFallback(DrawClosureConfirmationCodec, response, 'updateClosureConfirmation');
  },

  deleteClosureConfirmation: async (confirmationId: string | number): Promise<void> => {
    await apiClient.delete(`${settings.api.endpoints.closureConfirmations()}${confirmationId}/`);
  }
};
