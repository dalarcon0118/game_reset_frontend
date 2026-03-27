import { ValidationRuleApiAdapter } from './adapters/validation_rule.api.adapter';
import { IValidationRuleRepository } from './validation_rule.ports';

export * from './validation_rule.ports';
export * from './types/types';

// Singleton instance for the repository
export const ValidationRuleRepository: IValidationRuleRepository = new ValidationRuleApiAdapter();
