import { ValidationRule } from '@/types/rules';

export interface IValidationRuleRepository {
    list(params?: { is_active?: boolean }): Promise<ValidationRule[]>;
    getForCurrentUser(includeHierarchy?: boolean): Promise<ValidationRule[]>;
    getByStructure(structureId: string): Promise<ValidationRule[]>;
    getAvailableTemplates(): Promise<ValidationRule[]>;
    getAvailableTemplatesWithStatus(): Promise<(ValidationRule & { isActivated: boolean })[]>;
    copyTemplateToStructure(templateId: string, structureId: string, options?: any): Promise<ValidationRule>;
    updateStructureRule(ruleId: string, updates: Partial<ValidationRule>): Promise<ValidationRule>;
    getById(ruleId: string): Promise<ValidationRule>;
    deleteStructureRule(ruleId: string): Promise<void>;
}
