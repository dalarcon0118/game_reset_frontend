import apiClient from '@/shared/services/api_client';
import { BackendValidationRule, BackendStructureSpecificRule, BackendRuleRepository } from '../types/types';
import {
    BackendValidationRuleArrayCodec,
    BackendStructureSpecificRuleCodec,
    BackendStructureSpecificRuleArrayCodec,
    BackendRuleRepositoryArrayCodec,
    decodeOrFallback
} from '../codecs/codecs';

export const ValidationRuleApi = {
    list: async (params?: { is_active?: boolean }): Promise<BackendValidationRule[]> => {
        let endpoint = '/draw/validation-rules/';
        if (params?.is_active !== undefined) {
            const queryParams = new URLSearchParams();
            queryParams.append('is_active', params.is_active.toString());
            endpoint += `?${queryParams.toString()}`;
        }
        const response = await apiClient.get<BackendValidationRule[]>(endpoint);
        return decodeOrFallback(BackendValidationRuleArrayCodec, response, 'list');
    },

    getForCurrentUser: async (includeHierarchy: boolean = false): Promise<BackendValidationRule[]> => {
        const queryParams = includeHierarchy ? '?include_hierarchy=true' : '';
        const response = await apiClient.get<BackendValidationRule[]>(
            `/draw/validation-rules/for-current-user/${queryParams}`
        );
        return decodeOrFallback(BackendValidationRuleArrayCodec, response, 'getForCurrentUser');
    },

    getByStructure: async (structureId: string): Promise<BackendStructureSpecificRule[]> => {
        const response = await apiClient.get<BackendStructureSpecificRule[]>(
            `/draw/structure-specific-rules/by-structure/${structureId}/`
        );
        return decodeOrFallback(BackendStructureSpecificRuleArrayCodec, response, 'getByStructure');
    },

    getAvailableTemplates: async (): Promise<BackendRuleRepository[]> => {
        const response = await apiClient.get<BackendRuleRepository[]>('/draw/structure-specific-rules/available-templates/');
        return decodeOrFallback(BackendRuleRepositoryArrayCodec, response, 'getAvailableTemplates');
    },

    copyTemplateToStructure: async (
        templateId: string,
        structureId: string,
        options?: any
    ): Promise<BackendStructureSpecificRule> => {
        const response = await apiClient.post<BackendStructureSpecificRule>(
            `/draw/rule-repository/${templateId}/copy-to-structure/${structureId}/`,
            options || {}
        );
        return decodeOrFallback(BackendStructureSpecificRuleCodec, response, 'copyTemplateToStructure');
    },

    updateStructureRule: async (
        ruleId: string,
        updates: Partial<BackendStructureSpecificRule>
    ): Promise<BackendStructureSpecificRule> => {
        const response = await apiClient.patch<BackendStructureSpecificRule>(
            `/draw/structure-specific-rules/${ruleId}/`,
            updates
        );
        return decodeOrFallback(BackendStructureSpecificRuleCodec, response, 'updateStructureRule');
    },

    getStructureSpecificRuleById: async (ruleId: string): Promise<BackendStructureSpecificRule> => {
        const response = await apiClient.get<BackendStructureSpecificRule>(
            `/draw/structure-specific-rules/${ruleId}/`
        );
        return decodeOrFallback(BackendStructureSpecificRuleCodec, response, 'getStructureSpecificRuleById');
    },

    deleteStructureRule: async (ruleId: string): Promise<void> => {
        await apiClient.delete(`/draw/structure-specific-rules/${ruleId}/`);
    }
};
