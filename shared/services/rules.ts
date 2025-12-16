import { DrawRules } from '@/types';
import { mockRules } from '@/data/mockData';
import ApiClient from './ApiClient';
import settings from '@/config/settings';

// Simulate server response delay for mock data
const RESPONSE_DELAY = 500;

// Types for validation and reward rules
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  json_logic: any;
  is_active: boolean;
  bet_types: string[];
  created_at: string;
  updated_at: string;
}

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

export interface UnifiedRulesResponse {
  validation_rules: ValidationRule[];
  reward_rules: RewardRule[];
  structure_id: number;
  draw_id: number;
  draw_name: string;
  structure_name: string;
}

export class RulesService {
  // ============================================
  // Draw Rules (Mock Data - Bet Limits, Prizes)
  // ============================================

  /**
   * Get draw rules for a specific draw (mock data)
   * @param drawId string
   * @returns Promise<DrawRules | null>
   */
  static get(drawId: string): Promise<DrawRules | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rules = mockRules.find(rule => rule.drawId === drawId);
        resolve(rules || null);
      }, RESPONSE_DELAY);
    });
  }

  /**
   * Get all draw rules (mock data)
   * @returns Promise<DrawRules[]>
   */
  static list(): Promise<DrawRules[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockRules]);
      }, RESPONSE_DELAY);
    });
  }

  /**
   * Filter draw rules based on criteria (mock data)
   * @param criteria FilterCriteria
   * @returns Promise<DrawRules[]>
   */
  static filter(criteria: {
    drawId?: string;
    minBetLimit?: number;
    maxBetLimit?: number;
    minPrize?: number;
    maxPrize?: number;
  }): Promise<DrawRules[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredRules = [...mockRules];

        if (criteria.drawId) {
          filteredRules = filteredRules.filter(rule =>
            rule.drawId === criteria.drawId
          );
        }

        if (criteria.minBetLimit) {
          filteredRules = filteredRules.filter(rule =>
            Math.min(
              rule.betLimits.fijo,
              rule.betLimits.corrido,
              rule.betLimits.parlet,
              rule.betLimits.centena
            ) >= criteria.minBetLimit!
          );
        }

        if (criteria.maxBetLimit) {
          filteredRules = filteredRules.filter(rule =>
            Math.max(
              rule.betLimits.fijo,
              rule.betLimits.corrido,
              rule.betLimits.parlet,
              rule.betLimits.centena
            ) <= criteria.maxBetLimit!
          );
        }

        if (criteria.minPrize) {
          filteredRules = filteredRules.filter(rule =>
            Math.min(
              rule.prizesPerDollar.fijo,
              rule.prizesPerDollar.corrido,
              rule.prizesPerDollar.parlet,
              rule.prizesPerDollar.centena
            ) >= criteria.minPrize!
          );
        }

        if (criteria.maxPrize) {
          filteredRules = filteredRules.filter(rule =>
            Math.max(
              rule.prizesPerDollar.fijo,
              rule.prizesPerDollar.corrido,
              rule.prizesPerDollar.parlet,
              rule.prizesPerDollar.centena
            ) <= criteria.maxPrize!
          );
        }

        resolve(filteredRules);
      }, RESPONSE_DELAY);
    });
  }

  // ============================================
  // Unified Rules Endpoint (Backend API)
  // ============================================

  /**
   * Get all rules (validation and reward) for a draw
   * Uses JWT token to automatically get rules for the authenticated user's structure
   * @param drawId - ID of the draw
   * @returns Promise with validation and reward rules
   */
  static async getAllRulesForDraw(drawId: string): Promise<UnifiedRulesResponse | null> {
    try {
      const response = await ApiClient.get<UnifiedRulesResponse>(
        `${settings.api.endpoints.draws}${drawId}/rules-for-current-user/`
      );
      console.info(`[Unified Rules for drawId: ${drawId}]`, JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Error fetching unified rules for draw:', error);
      return null;
    }
  }

  // ============================================
  // Validation Rules (Backend API)
  // ============================================

  /**
   * Get validation rules for the current authenticated user's structure
   * The structure ID is extracted from the JWT token on the backend
   */
  static async getValidationRulesForCurrentUser(): Promise<ValidationRule[]> {
    try {
      const response = await ApiClient.get<ValidationRule[]>(
        '/draw/validation-rules/for-current-user/'
      );
      return response;
    } catch (error) {
      console.error('Error fetching validation rules for current user:', error);
      return [];
    }
  }

  /**
   * Get validation rules for a specific structure
   */
  static async getValidationRulesByStructure(structureId: string): Promise<ValidationRule[]> {
    try {
      const response = await ApiClient.get<ValidationRule[]>(
        `/draw/validation-rules/by-structure/${structureId}/`
      );
      return response;
    } catch (error) {
      console.error('Error fetching validation rules by structure:', error);
      return [];
    }
  }

  /**
   * Get all active validation rules
   */
  static async listValidationRules(params?: { is_active?: boolean }): Promise<ValidationRule[]> {
    try {
      let endpoint = '/draw/validation-rules/';
      if (params?.is_active !== undefined) {
        const queryParams = new URLSearchParams();
        queryParams.append('is_active', params.is_active.toString());
        endpoint += `?${queryParams.toString()}`;
      }
      const response = await ApiClient.get<ValidationRule[]>(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching validation rules:', error);
      return [];
    }
  }

  // ============================================
  // Reward Rules (Backend API)
  // ============================================

  /**
   * Get reward rules for the current authenticated user's structure
   * The structure ID is extracted from the JWT token on the backend
   */
  static async getRewardRulesForCurrentUser(): Promise<RewardRule[]> {
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

  /**
   * Get reward rules for a specific structure
   */
  static async getRewardRulesByStructure(structureId: string): Promise<RewardRule[]> {
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

  /**
   * Get all active reward rules
   */
  static async listRewardRules(params?: { is_active?: boolean }): Promise<RewardRule[]> {
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
}