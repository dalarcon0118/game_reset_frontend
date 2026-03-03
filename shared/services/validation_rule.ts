import { ApiClientError } from './api_client/api_client';
import { createStream } from '../utils/generators';
import { transformTemplatesWithStatus, generatorToArray } from '../utils/generators';
import { ValidationRuleApi } from './validation_rule/api';
import {
    BackendValidationRule as ValidationRule,
    BackendStructureValidationRule as StructureValidationRule,
    BackendRuleRepository as RuleRepository,
    BackendStructureSpecificRule as StructureSpecificRule
} from './validation_rule/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('VALIDATION_RULE_SERVICE');

export type { ValidationRule, StructureValidationRule, RuleRepository, StructureSpecificRule };

export class ValidationRuleService {
    /**
     * Get all validation rules
     */
    static async list(params?: { is_active?: boolean }): Promise<ValidationRule[]> {
        try {
            return await ValidationRuleApi.list(params);
        } catch (error) {
            log.error('Error fetching validation rules', error);
            return [];
        }
    }

    /**
     * Get validation rules for the current authenticated user's structure
     */
    static async getForCurrentUser(includeHierarchy: boolean = false): Promise<ValidationRule[]> {
        try {
            return await ValidationRuleApi.getForCurrentUser(includeHierarchy);
        } catch (error) {
            log.error('Error fetching validation rules for current user', error);
            if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
                throw error;
            }
            return [];
        }
    }

    /**
     * Get validation rules for a specific structure (bank/listeria)
     */
    static async getByStructure(structureId: string): Promise<StructureSpecificRule[]> {
        try {
            return await ValidationRuleApi.getByStructure(structureId);
        } catch (error) {
            log.error('Error fetching validation rules by structure', error);
            return [];
        }
    }

    /**
     * Get all available rule templates that can be copied to structures
     */
    static async getAvailableTemplates(): Promise<RuleRepository[]> {
        try {
            return await ValidationRuleApi.getAvailableTemplates();
        } catch (error) {
            log.error('Error fetching rule templates', error);
            return [];
        }
    }

    /**
     * Get available templates with status using yield *
     */
    static async getAvailableTemplatesWithStatus(): Promise<(RuleRepository & { isActivated: boolean })[]> {
        const generator = createStream(() => this.getAvailableTemplates());
        const transformedGenerator = transformTemplatesWithStatus(generator);
        return generatorToArray(transformedGenerator);
    }

    /**
     * Copy a rule template to a specific structure
     */
    static async copyTemplateToStructure(
        templateId: string,
        structureId: string,
        options?: {
            apply_to_all_children?: boolean;
            specific_children?: string[];
            priority?: number;
        }
    ): Promise<StructureSpecificRule> {
        try {
            return await ValidationRuleApi.copyTemplateToStructure(templateId, structureId, options);
        } catch (error) {
            log.error('Error copying rule template to structure', error);
            throw error;
        }
    }

    /**
     * Update a structure-specific rule
     */
    static async updateStructureRule(
        ruleId: string,
        updates: Partial<StructureSpecificRule>
    ): Promise<StructureSpecificRule> {
        try {
            return await ValidationRuleApi.updateStructureRule(ruleId, updates);
        } catch (error) {
            log.error('Error updating structure rule', { ruleId, error });
            throw error;
        }
    }

    /**
     * Delete a structure-specific rule
     */
    static async deleteStructureRule(ruleId: string): Promise<void> {
        try {
            await ValidationRuleApi.deleteStructureRule(ruleId);
        } catch (error) {
            log.error('Error deleting structure rule', { ruleId, error });
            throw error;
        }
    }
}

export default ValidationRuleService;
