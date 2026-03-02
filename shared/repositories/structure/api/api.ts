import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { BackendChildStructure, BackendListeroDetails } from '../types/types';
import { ChildStructureArrayCodec, ListeroDetailsCodec, decodeOrFallback } from '../codecs/codecs';

export const StructureApi = {
    getChildren: async (id: number, level: number = 1): Promise<BackendChildStructure[]> => {
        const params = new URLSearchParams();
        params.append('level', level.toString());
        params.append('active', 'true');
        params.append('draw', 'true');
        params.append('today', 'true');

        const endpoint = `${settings.api.endpoints.structures()}${id}/children/?${params.toString()}`;
        const response = await apiClient.get<BackendChildStructure[]>(endpoint);
        return decodeOrFallback(ChildStructureArrayCodec, response, 'getChildren');
    },

    getListeroDetails: async (id: number, date?: string): Promise<BackendListeroDetails> => {
        let endpoint = `${settings.api.endpoints.structures()}${id}/listero_details/`;
        if (date) {
            endpoint += `?date=${date}`;
        }
        const response = await apiClient.get<BackendListeroDetails>(endpoint);
        return decodeOrFallback(ListeroDetailsCodec, response, 'getListeroDetails');
    }
};
