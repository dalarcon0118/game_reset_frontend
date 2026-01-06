// Main Model interface - brings together all state types
import { FijosCorridosBet, ParletBet, CentenaBet, GameType } from './base.types';
import { UiState } from './ui.types';
import { CreateSession, EditSession } from './session.types';
import { RewardsCache, RulesCache } from './cache.types';

export interface Model extends UiState {
    // Core data
    drawId: string | null;
    betTypes: {
        fijo: string | null;
        corrido: string | null;
        parlet: string | null;
        centena: string | null;
    };
    fijosCorridos: FijosCorridosBet[];
    parlets: ParletBet[];
    centenas: CentenaBet[];
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;
    saveSuccess: boolean;

    // Sessions
    createSession: CreateSession;
    editSession: EditSession;

    // Cache
    rewards: RewardsCache;
    rules: RulesCache;
}
