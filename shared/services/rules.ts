import { DrawRules } from '@/types';
import { mockRules } from '@/data/mock_data';
import { ApiClientError } from './api_client';
import { RulesApi } from './rules/api';
import {
  BackendUnifiedRulesResponse as UnifiedRulesResponse,
  BackendValidationRule as ValidationRule,
  BackendRewardRule as RewardRule
} from './rules/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RULES_SERVICE');

export type { ValidationRule, RewardRule, UnifiedRulesResponse };

// Simulate server response delay for mock data
const RESPONSE_DELAY = 500;

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
          filteredRules = filteredRules.filter(rule => rule.drawId === criteria.drawId);
        }

        if (criteria.minBetLimit) {
          filteredRules = filteredRules.filter(rule =>
            Math.min(rule.betLimits.fijo, rule.betLimits.corrido, rule.betLimits.parlet, rule.betLimits.centena) >= criteria.minBetLimit!
          );
        }

        if (criteria.maxBetLimit) {
          filteredRules = filteredRules.filter(rule =>
            Math.max(rule.betLimits.fijo, rule.betLimits.corrido, rule.betLimits.parlet, rule.betLimits.centena) <= criteria.maxBetLimit!
          );
        }

        if (criteria.minPrize) {
          filteredRules = filteredRules.filter(rule =>
            Math.min(rule.prizesPerDollar.fijo, rule.prizesPerDollar.corrido, rule.prizesPerDollar.parlet, rule.prizesPerDollar.centena) >= criteria.minPrize!
          );
        }

        if (criteria.maxPrize) {
          filteredRules = filteredRules.filter(rule =>
            Math.max(rule.prizesPerDollar.fijo, rule.prizesPerDollar.corrido, rule.prizesPerDollar.parlet, rule.prizesPerDollar.centena) <= criteria.maxPrize!
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
   */
  static async getAllRulesForDraw(drawId: string): Promise<UnifiedRulesResponse | null> {
    try {
      return await RulesApi.getAllRulesForDraw(drawId);
    } catch (error) {
      log.error('Error fetching unified rules for draw', error);
      return null;
    }
  }

  // ============================================
  // Validation Rules (Backend API)
  // ============================================

  /**
   * Get validation rules for the current authenticated user's structure
   */
  static async getValidationRulesForCurrentUser(): Promise<ValidationRule[]> {
    try {
      return await RulesApi.getValidationRulesForCurrentUser();
    } catch (error) {
      log.error('Error fetching validation rules for current user', error);
      if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Get validation rules for a specific structure
   */
  static async getValidationRulesByStructure(structureId: string): Promise<ValidationRule[]> {
    try {
      return await RulesApi.getValidationRulesByStructure(structureId);
    } catch (error) {
      log.error('Error fetching validation rules by structure', error);
      return [];
    }
  }
}
