import { IRulesRepository } from './rules.ports';
import { RulesApiAdapter } from './adapters/rules.api.adapter';

export * from './rules.ports';
export * from './api/types/types';

export const rulesRepository: IRulesRepository = new RulesApiAdapter();
