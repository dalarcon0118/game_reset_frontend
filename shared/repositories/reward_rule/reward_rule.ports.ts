import { BackendRewardRule, BackendStructureRewardRule } from './api/types/types';

export interface IRewardRuleRepository {
    list(params?: { is_active?: boolean }): Promise<BackendRewardRule[]>;
    getForCurrentUser(): Promise<BackendRewardRule[]>;
    getByStructure(structureId: string): Promise<BackendRewardRule[]>;
    getByBetType(betTypeId: string): Promise<BackendRewardRule[]>;
    get(id: string): Promise<BackendRewardRule | null>;
}
