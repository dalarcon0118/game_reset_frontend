import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { BackendDraw, DrawClosureConfirmation } from './types';
import { 
  BackendDrawCodec, 
  BackendDrawArrayCodec, 
  DrawClosureConfirmationCodec, 
  DrawClosureConfirmationArrayCodec, 
  decodeOrFallback 
} from './codecs';

export const DrawApi = {
  getOne: async (id: string): Promise<BackendDraw> => {
    const response = await apiClient.get<BackendDraw>(`${settings.api.endpoints.draws()}${id}/`);
    return decodeOrFallback(BackendDrawCodec, response, `getOne(${id})`);
  },

  list: async (params: Record<string, any> = {}): Promise<BackendDraw[]> => {
    const queryParams = { ...params };
    if (queryParams.next24h) {
      queryParams.next_24h = queryParams.next24h;
      delete queryParams.next24h;
    }
    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = queryString
      ? `${settings.api.endpoints.draws()}?${queryString}`
      : settings.api.endpoints.draws();
    
    const response = await apiClient.get<any>(endpoint);
    
    // Normalization logic that was in the service
    let data: BackendDraw[] = [];
    if (Array.isArray(response)) data = response;
    else if (Array.isArray(response?.results)) data = response.results;
    else if (Array.isArray(response?.data)) data = response.data;
    
    return decodeOrFallback(BackendDrawArrayCodec, data, 'list');
  },

  getBetTypes: async (drawId: string): Promise<any[]> => {
    const endpoint = `${settings.api.endpoints.draws()}${drawId}/bet-types/`;
    return await apiClient.get<any[]>(endpoint);
  },

  getRulesForDraw: async (drawId: string): Promise<any> => {
    return await apiClient.get<any>(
      `${settings.api.endpoints.draws()}${drawId}/rules-for-current-user/`
    );
  },

  addWinningNumbers: async (drawId: string, data: { winning_number: string; date: string }): Promise<any> => {
    return await apiClient.post<any>(
      `${settings.api.endpoints.draws()}${drawId}/add-winning-numbers/`,
      data
    );
  },

  updateStatus: async (drawId: string | number, status: 'success' | 'reported'): Promise<void> => {
    await apiClient.patch(
      `${settings.api.endpoints.draws()}${drawId}/`,
      { status_closed: status }
    );
  },

  getClosureConfirmationsByDraw: async (drawId: string | number): Promise<DrawClosureConfirmation[]> => {
    const response = await apiClient.get<DrawClosureConfirmation[]>(
      `${settings.api.baseUrl}/draw/draw-closure-confirmations/by-draw/${drawId}/`
    );
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'getClosureConfirmationsByDraw');
  },

  createClosureConfirmationsForDraw: async (
    drawId: string | number,
    data?: { status?: string; notes?: string }
  ): Promise<DrawClosureConfirmation[]> => {
    const response = await apiClient.post<DrawClosureConfirmation[]>(
      `${settings.api.baseUrl}/draw/draw-closure-confirmations/create-for-draw/${drawId}/`,
      data || {}
    );
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'createClosureConfirmationsForDraw');
  },

  confirmClosure: async (
    confirmationId: string | number,
    status: string,
    notes?: string
  ): Promise<DrawClosureConfirmation> => {
    const payload: any = { status };
    if (notes) payload.notes = notes;
    const response = await apiClient.post<DrawClosureConfirmation>(
      `${settings.api.baseUrl}/draw/draw-closure-confirmations/${confirmationId}/confirm/`,
      payload
    );
    return decodeOrFallback(DrawClosureConfirmationCodec, response, 'confirmClosure');
  },

  getPendingClosureConfirmations: async (): Promise<DrawClosureConfirmation[]> => {
    const response = await apiClient.get<DrawClosureConfirmation[]>(
      `${settings.api.baseUrl}/draw/draw-closure-confirmations/pending-for-user/`
    );
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'getPendingClosureConfirmations');
  },

  getClosureConfirmations: async (filters?: any): Promise<DrawClosureConfirmation[]> => {
    let endpoint = `${settings.api.baseUrl}/draw/draw-closure-confirmations/`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.draw) params.append('draw', filters.draw.toString());
      if (filters.structure) params.append('structure', filters.structure.toString());
      if (filters.status) params.append('status', filters.status);
      if (params.toString()) endpoint += `?${params.toString()}`;
    }
    const response = await apiClient.get<DrawClosureConfirmation[]>(endpoint);
    return decodeOrFallback(DrawClosureConfirmationArrayCodec, response, 'getClosureConfirmations');
  },

  updateClosureConfirmation: async (
    confirmationId: string | number,
    data: any
  ): Promise<DrawClosureConfirmation> => {
    const response = await apiClient.patch<DrawClosureConfirmation>(
      `${settings.api.baseUrl}/draw/draw-closure-confirmations/${confirmationId}/`,
      data
    );
    return decodeOrFallback(DrawClosureConfirmationCodec, response, 'updateClosureConfirmation');
  },

  deleteClosureConfirmation: async (confirmationId: string | number): Promise<void> => {
    await apiClient.delete(`${settings.api.baseUrl}/draw/draw-closure-confirmations/${confirmationId}/`);
  }
};
