import { IRewardRuleRepository } from './reward_rule.ports';
import { RewardRuleApiAdapter } from './adapters/reward_rule.api.adapter';

export * from './reward_rule.ports';
export * from './api/types/types';

export const rewardRuleRepository: IRewardRuleRepository = new RewardRuleApiAdapter();
