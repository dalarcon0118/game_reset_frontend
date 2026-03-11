import apiClient from '@/shared/services/api_client';
import { PromotionResponse } from './types';

export const promotionApi = {
    getPromotions: async (): Promise<PromotionResponse[]> => {
        try {
            const response = await apiClient.get<PromotionResponse[]>('api/promotions/');
            return response;
        } catch (error) {
            console.error('[PromotionAPI] Error fetching promotions:', error);
            throw error;
        }
    }
};
