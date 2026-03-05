import apiClient from '@/shared/services/api_client';
import { BackendRewardRule, BackendStructureRewardRule } from './types/types';
import {
    BackendRewardRuleCodec,
    BackendRewardRuleArrayCodec,
    decodeOrFallback
} from './codecs/codecs';

export const RewardRuleApi = {
    list: async (params?: { is_active?: boolean }): Promise<BackendRewardRule[]> => {
        let endpoint = '/draw/reward-rules/';
        if (params?.is_active !== undefined) {
            const queryParams = new URLSearchParams();
            queryParams.append('is_active', params.is_active.toString());
            endpoint += `?${queryParams.toString()}`;
        }
        const response = await apiClient.get<BackendRewardRule[]>(endpoint);
        return decodeOrFallback(BackendRewardRuleArrayCodec, response, 'list');
    },

    getForCurrentUser: async (): Promise<BackendRewardRule[]> => {
        const response = await apiClient.get<BackendRewardRule[]>('/draw/reward-rules/for-current-user/');
        return decodeOrFallback(BackendRewardRuleArrayCodec, response, 'getForCurrentUser');
    },

    getByStructure: async (structureId: string): Promise<BackendRewardRule[]> => {
        const response = await apiClient.get<BackendRewardRule[]>(`/draw/reward-rules/by-structure/${structureId}/`);
        return decodeOrFallback(BackendRewardRuleArrayCodec, response, 'getByStructure');
    },

    getByBetType: async (betTypeId: string): Promise<BackendRewardRule[]> => {
        const response = await apiClient.get<BackendRewardRule[]>(`/draw/reward-rules/?bet_type=${betTypeId}`);
        return decodeOrFallback(BackendRewardRuleArrayCodec, response, 'getByBetType');
    },

    get: async (id: string): Promise<BackendRewardRule | null> => {
        const response = await apiClient.get<BackendRewardRule>(`/draw/reward-rules/${id}/`);
        if (!response) return null;
        return decodeOrFallback(BackendRewardRuleCodec, response, 'get');
    }
};
