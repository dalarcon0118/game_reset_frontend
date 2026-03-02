import { IRewardRuleRepository } from '../reward_rule.ports';
import { RewardRuleApi } from '../api/api';
import { BackendRewardRule } from '../api/types/types';

export class RewardRuleApiAdapter implements IRewardRuleRepository {
    async list(params?: { is_active?: boolean }): Promise<BackendRewardRule[]> {
        return RewardRuleApi.list(params);
    }

    async getForCurrentUser(): Promise<BackendRewardRule[]> {
        return RewardRuleApi.getForCurrentUser();
    }

    async getByStructure(structureId: string): Promise<BackendRewardRule[]> {
        return RewardRuleApi.getByStructure(structureId);
    }

    async getByBetType(betTypeId: string): Promise<BackendRewardRule[]> {
        return RewardRuleApi.getByBetType(betTypeId);
    }

    async get(id: string): Promise<BackendRewardRule | null> {
        return RewardRuleApi.get(id);
    }
}
