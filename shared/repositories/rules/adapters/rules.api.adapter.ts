import { IRulesRepository, UnifiedRulesResponse, ValidationRule } from '../rules.ports';
import { RulesApi } from '../api/api';
import { DrawRules } from '@/types';
import { mockRules } from '@/data/mock_data';

const RESPONSE_DELAY = 500;

export class RulesApiAdapter implements IRulesRepository {
    // Legacy Mock Methods
    async get(drawId: string): Promise<DrawRules | null> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const rules = mockRules.find(rule => rule.drawId === drawId);
                resolve(rules || null);
            }, RESPONSE_DELAY);
        });
    }

    async list(): Promise<DrawRules[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...mockRules]);
            }, RESPONSE_DELAY);
        });
    }

    async filter(criteria: {
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

    // API Methods
    async getAllRulesForDraw(drawId: string): Promise<UnifiedRulesResponse | null> {
        return RulesApi.getAllRulesForDraw(drawId);
    }

    async getValidationRulesForCurrentUser(): Promise<ValidationRule[]> {
        return RulesApi.getValidationRulesForCurrentUser();
    }

    async getValidationRulesByStructure(structureId: string): Promise<ValidationRule[]> {
        return RulesApi.getValidationRulesByStructure(structureId);
    }
}
