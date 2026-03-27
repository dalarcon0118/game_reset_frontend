import { ApiClientError } from './api_client';
import {
    ValidationRuleRepository,
    BackendValidationRule as ValidationRule,
    BackendStructureValidationRule as StructureValidationRule,
    BackendRuleRepository as RuleRepository,
    BackendStructureSpecificRule as StructureSpecificRule
} from '../repositories/validation_rule';
import { ValidationRule as DomainRule } from '@/types/rules';

export type { ValidationRule, StructureValidationRule, RuleRepository, StructureSpecificRule };

/**
 * @deprecated Use ValidationRuleRepository directly for new code.
 * This service acts as a bridge for backward compatibility.
 */
export class ValidationRuleService {
    /**
     * Get all validation rules
     */
    static async list(params?: { is_active?: boolean }): Promise<DomainRule[]> {
        return ValidationRuleRepository.list(params);
    }

    /**
     * Get validation rules for the current authenticated user's structure
     */
    static async getForCurrentUser(includeHierarchy: boolean = false): Promise<DomainRule[]> {
        try {
            return await ValidationRuleRepository.getForCurrentUser(includeHierarchy);
        } catch (error) {
            if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
                throw error;
            }
            return [];
        }
    }

    /**
     * Get validation rules for a specific structure (bank/listeria)
     */
    static async getByStructure(structureId: string): Promise<DomainRule[]> {
        return ValidationRuleRepository.getByStructure(structureId);
    }

    /**
     * Get all available rule templates that can be copied to structures
     */
    static async getAvailableTemplates(): Promise<DomainRule[]> {
        return ValidationRuleRepository.getAvailableTemplates();
    }

    /**
     * Get available templates with status
     */
    static async getAvailableTemplatesWithStatus(): Promise<(DomainRule & { isActivated: boolean })[]> {
        return ValidationRuleRepository.getAvailableTemplatesWithStatus();
    }

    /**
     * Copy a rule template to a specific structure
     */
    static async copyTemplateToStructure(
        templateId: string,
        structureId: string,
        options?: any
    ): Promise<DomainRule> {
        return ValidationRuleRepository.copyTemplateToStructure(templateId, structureId, options);
    }

    /**
     * Update a structure-specific rule
     */
    static async updateStructureRule(
        ruleId: string,
        updates: Partial<DomainRule>
    ): Promise<DomainRule> {
        return ValidationRuleRepository.updateStructureRule(ruleId, updates);
    }

    /**
     * Get a structure-specific rule by ID
     */
    static async getStructureSpecificRuleById(ruleId: string): Promise<DomainRule> {
        return ValidationRuleRepository.getById(ruleId);
    }

    /**
     * Delete a structure-specific rule
     */
    static async deleteStructureRule(ruleId: string): Promise<void> {
        return ValidationRuleRepository.deleteStructureRule(ruleId);
    }
}

export default ValidationRuleService;
