import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { BackendUnifiedRulesResponse, BackendValidationRule } from './types';
import {
    BackendUnifiedRulesResponseCodec,
    BackendValidationRuleArrayCodec,
    decodeOrFallback
} from './codecs';

export const RulesApi = {
    getAllRulesForDraw: async (drawId: string): Promise<BackendUnifiedRulesResponse | null> => {
        const response = await apiClient.get<BackendUnifiedRulesResponse>(
            `${settings.api.endpoints.draws()}${drawId}/rules-for-current-user/`
        );
        if (!response) return null;
        return decodeOrFallback(BackendUnifiedRulesResponseCodec, response, 'getAllRulesForDraw');
    },

    getValidationRulesForCurrentUser: async (): Promise<BackendValidationRule[]> => {
        const response = await apiClient.get<BackendValidationRule[]>(
            '/draw/validation-rules/for-current-user/'
        );
        return decodeOrFallback(BackendValidationRuleArrayCodec, response, 'getValidationRulesForCurrentUser');
    },

    getValidationRulesByStructure: async (structureId: string): Promise<BackendValidationRule[]> => {
        const response = await apiClient.get<BackendValidationRule[]>(
            `/draw/validation-rules/by-structure/${structureId}/`
        );
        return decodeOrFallback(BackendValidationRuleArrayCodec, response, 'getValidationRulesByStructure');
    }
};
