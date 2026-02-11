import { RewardRuleApi } from './reward_rule/api';
import { BackendRewardRule, BackendStructureRewardRule } from './reward_rule/types';

export type { BackendRewardRule as RewardRule, BackendStructureRewardRule as StructureRewardRule };

export class RewardRuleService {
  static async list(params?: { is_active?: boolean }): Promise<BackendRewardRule[]> {
    try {
      return await RewardRuleApi.list(params);
    } catch (error) {
      console.error('Error fetching reward rules:', error);
      return [];
    }
  }

  static async getForCurrentUser(): Promise<BackendRewardRule[]> {
    try {
      return await RewardRuleApi.getForCurrentUser();
    } catch (error) {
      console.error('Error fetching reward rules for current user:', error);
      return [];
    }
  }

  static async getByStructure(structureId: string): Promise<BackendRewardRule[]> {
    try {
      return await RewardRuleApi.getByStructure(structureId);
    } catch (error) {
      console.error('Error fetching reward rules by structure:', error);
      return [];
    }
  }

  static async getByBetType(betTypeId: string): Promise<BackendRewardRule[]> {
    try {
      return await RewardRuleApi.getByBetType(betTypeId);
    } catch (error) {
      console.error('Error fetching reward rules by bet type:', error);
      return [];
    }
  }

  static async get(id: string): Promise<BackendRewardRule | null> {
    try {
      return await RewardRuleApi.get(id);
    } catch (error) {
      console.error('Error fetching reward rule:', error);
      return null;
    }
  }
}
