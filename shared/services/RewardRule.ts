import ApiClient from '@/shared/services/ApiClient';

export interface RewardRule {
  id: string;
  name: string;
  description: string;
  json_logic: any;
  is_active: boolean;
  bet_types: string[];
  created_at: string;
  updated_at: string;
}

export interface StructureRewardRule {
  id: string;
  structure: string;
  rule: RewardRule;
  apply_to_all_children: boolean;
  specific_children: string[];
  priority: number;
  is_active: boolean;
}

export class RewardRuleService {
  static async list(params?: { is_active?: boolean }): Promise<RewardRule[]> {
    try {
      let endpoint = '/draw/reward-rules/';
      if (params?.is_active !== undefined) {
        const queryParams = new URLSearchParams();
        queryParams.append('is_active', params.is_active.toString());
        endpoint += `?${queryParams.toString()}`;
      }
      const response = await ApiClient.get<RewardRule[]>(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching reward rules:', error);
      return [];
    }
  }

  static async getForCurrentUser(): Promise<RewardRule[]> {
    try {
      const response = await ApiClient.get<RewardRule[]>(
        '/draw/reward-rules/for-current-user/'
      );
      return response;
    } catch (error) {
      console.error('Error fetching reward rules for current user:', error);
      return [];
    }
  }

  static async getByStructure(structureId: string): Promise<RewardRule[]> {
    try {
      const response = await ApiClient.get<RewardRule[]>(
        `/draw/reward-rules/by-structure/${structureId}/`
      );
      return response;
    } catch (error) {
      console.error('Error fetching reward rules by structure:', error);
      return [];
    }
  }

  static async getByBetType(betTypeId: string): Promise<RewardRule[]> {
    try {
      const response = await ApiClient.get<RewardRule[]>(
        `/draw/reward-rules/?bet_type=${betTypeId}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching reward rules by bet type:', error);
      return [];
    }
  }

  static async get(id: string): Promise<RewardRule | null> {
    try {
      const response = await ApiClient.get<RewardRule>(`/draw/reward-rules/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching reward rule:', error);
      return null;
    }
  }
}
