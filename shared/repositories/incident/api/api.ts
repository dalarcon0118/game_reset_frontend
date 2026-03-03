import apiClient from '@/shared/services/api_client/api_client';
import settings from '@/config/settings';
import { BackendIncident, IncidentCreateData } from './types/types';
import { BackendIncidentCodec, BackendIncidentArrayCodec, decodeOrFallback } from './codecs/codecs';

export const IncidentApi = {
    create: async (data: IncidentCreateData): Promise<BackendIncident> => {
        const response = await apiClient.post<BackendIncident>(settings.api.endpoints.incidents(), data);
        return decodeOrFallback(BackendIncidentCodec, response, 'create');
    },

    list: async (params?: { status?: string; ordering?: string; date?: string }): Promise<BackendIncident[]> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });
        }
        const queryString = queryParams.toString();
        const baseUrl = settings.api.endpoints.incidents();
        const url = queryString ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}` : baseUrl;
        const response = await apiClient.get<BackendIncident[]>(url);
        return decodeOrFallback(BackendIncidentArrayCodec, response, 'list');
    },

    updateStatus: async (id: string | number, status: string, notes: string): Promise<BackendIncident> => {
        const response = await apiClient.patch<BackendIncident>(`${settings.api.endpoints.incidents()}${id}/`, {
            status,
            notes
        });
        return decodeOrFallback(BackendIncidentCodec, response, 'updateStatus');
    }
};
