import { IValidationRuleRepository } from '../validation_rule.ports';
import { ValidationRuleApi } from '../api/api';
import { ValidationRule, RuleCategory, RuleStatus, ValidationType } from '@/types/rules';
import { BackendStructureSpecificRule, BackendRuleRepository, BackendValidationRule } from '../types/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('VALIDATION_RULE_ADAPTER');

/**
 * 🗺️ VALIDATION RULE MAPPERS (ACL)
 * Decouples backend response structures from frontend domain types.
 */
const ValidationRuleMapper = {
    fromBackendStructureSpecific: (r: BackendStructureSpecificRule): ValidationRule => ({
        id: String(r.id),
        name: r.name,
        description: r.description || '',
        category: (r.rule_type === 'validation' ? 'custom' : 'compliance') as RuleCategory,
        status: (r.is_active ? 'active' : 'inactive') as RuleStatus,
        scope: {
            agencyIds: r.specific_children.map(String),
            allAgencies: r.apply_to_all_children
        },
        validationType: 'business_rule' as ValidationType,
        parameters: r.json_logic || {},
        betTypes: (r.bet_types || []).map(String),
        examples: [],
        affectedAgencies: r.specific_children.map(String),
        baseTemplateId: r.base_template ? String(r.base_template) : undefined,
        modificationHistory: [],
        lastModified: r.updated_at,
        createdAt: r.created_at,
        version: 1,
    }),

    fromBackendRepository: (r: BackendRuleRepository): ValidationRule => ({
        id: String(r.id),
        name: r.name,
        description: r.description || '',
        category: (r.rule_type === 'validation' ? 'custom' : 'compliance') as RuleCategory,
        status: (r.is_active ? 'active' : 'inactive') as RuleStatus,
        scope: { agencyIds: [], allAgencies: true },
        validationType: 'business_rule' as ValidationType,
        parameters: r.json_logic || {},
        betTypes: (r.bet_types || []).map(String),
        examples: [],
        affectedAgencies: [],
        modificationHistory: [],
        lastModified: r.updated_at,
        createdAt: r.created_at,
        version: 1,
    }),

    fromBackendValidation: (r: BackendValidationRule): ValidationRule => ({
        id: String(r.id),
        name: r.name,
        description: r.description || '',
        category: 'custom' as RuleCategory,
        status: (r.is_active ? 'active' : 'inactive') as RuleStatus,
        scope: { agencyIds: [], allAgencies: true },
        validationType: 'business_rule' as ValidationType,
        parameters: r.json_logic || {},
        betTypes: (r.bet_types || []).map(String),
        examples: [],
        affectedAgencies: [],
        modificationHistory: [],
        lastModified: r.updated_at,
        createdAt: r.created_at,
        version: 1,
    }),
};

export class ValidationRuleApiAdapter implements IValidationRuleRepository {
    async list(params?: { is_active?: boolean }): Promise<ValidationRule[]> {
        try {
            const rules = await ValidationRuleApi.list(params);
            return rules.map(ValidationRuleMapper.fromBackendValidation);
        } catch (error) {
            log.error('Error fetching validation rules', error);
            return [];
        }
    }

    async getForCurrentUser(includeHierarchy: boolean = false): Promise<ValidationRule[]> {
        try {
            const rules = await ValidationRuleApi.getForCurrentUser(includeHierarchy);
            return rules.map(ValidationRuleMapper.fromBackendValidation);
        } catch (error) {
            log.error('Error fetching validation rules for current user', error);
            return [];
        }
    }

    async getByStructure(structureId: string): Promise<ValidationRule[]> {
        try {
            const rules = await ValidationRuleApi.getByStructure(structureId);
            return rules.map(ValidationRuleMapper.fromBackendStructureSpecific);
        } catch (error) {
            log.error('Error fetching validation rules by structure', error);
            return [];
        }
    }

    async getAvailableTemplates(): Promise<ValidationRule[]> {
        try {
            const rules = await ValidationRuleApi.getAvailableTemplates();
            return rules.map(ValidationRuleMapper.fromBackendRepository);
        } catch (error) {
            log.error('Error fetching available templates', error);
            return [];
        }
    }

    async getAvailableTemplatesWithStatus(): Promise<(ValidationRule & { isActivated: boolean })[]> {
        try {
            // NOTE: This logic was previously in ValidationRuleService using generators.
            // Simplified here for direct repository usage, but keeping the intent.
            const templates = await this.getAvailableTemplates();
            return templates.map(t => ({ ...t, isActivated: t.status === 'active' }));
        } catch (error) {
            log.error('Error fetching available templates with status', error);
            return [];
        }
    }

    async copyTemplateToStructure(templateId: string, structureId: string, options?: any): Promise<ValidationRule> {
        const rule = await ValidationRuleApi.copyTemplateToStructure(templateId, structureId, options);
        return ValidationRuleMapper.fromBackendStructureSpecific(rule);
    }

    async updateStructureRule(ruleId: string, updates: Partial<ValidationRule>): Promise<ValidationRule> {
        // NOTE: Domain updates must be mapped back to backend DTO if property names differ.
        // For now, assuming partial backend DTO for simplicity in updates.
        const backendUpdates: Partial<BackendStructureSpecificRule> = {
            name: updates.name,
            description: updates.description,
            is_active: updates.status === 'active',
            json_logic: updates.parameters,
        };
        const rule = await ValidationRuleApi.updateStructureRule(ruleId, backendUpdates);
        return ValidationRuleMapper.fromBackendStructureSpecific(rule);
    }

    async getById(ruleId: string): Promise<ValidationRule> {
        const rule = await ValidationRuleApi.getStructureSpecificRuleById(ruleId);
        return ValidationRuleMapper.fromBackendStructureSpecific(rule);
    }

    async deleteStructureRule(ruleId: string): Promise<void> {
        await ValidationRuleApi.deleteStructureRule(ruleId);
    }
}
