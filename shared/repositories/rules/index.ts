import { IRulesRepository } from './rules.ports';
import { RulesApiAdapter } from './adapters/rules.api.adapter';

export * from './rules.ports';

export const rulesRepository: IRulesRepository = new RulesApiAdapter();
