import { LoteriaFeatMsg, LoteriaState } from '../loteria/loteria.types';
import { WebData, RemoteData } from '@core/tea-utils';
import { LoteriaBet, DrawType, BetType, GameType } from '@/types';
import { UnifiedRulesResponse, ValidationRule, RewardRule } from '@/shared/services/rules';

export interface RulesCache {
    status: WebData<UnifiedRulesResponse | null>;
}

export const createRulesCache = (): RulesCache => ({
    status: RemoteData.notAsked()
});

export const initialRulesCache: RulesCache = createRulesCache();

// ============================================================================
// Internalized External Types (Agnostic - Refactor Workflow)
// ============================================================================

export interface EditSession {
    selectedColumn: string | null;
    selectedCircle: number | null;
    isRangeMode: boolean;
    rangeType: 'continuous' | 'terminal' | null;
    currentNumber: string;
    currentAmount: string;
    rangeStartNumber: string;
    showRangeDialog: boolean;
    rangeBets: number[];
    currentInput: string;
    showBetKeyboard: boolean;
    showAmountKeyboard: boolean;
    showParletKeyboard: boolean;
    betBuffer: number[];
    editingBetId: string | null;
    editingAmountType: 'loteria' | null;
    amountConfirmationDetails: {
        amountValue: number;
        intendedAmountType: 'loteria';
        intendedBetId: string | null;
    } | null;
}

export interface ListData {
    loteria: LoteriaBet[];
}

export interface ListSession {
    remoteData: WebData<ListData>;
    aliasFilter: string;
    isRefreshing: boolean;
    loadedDrawId: string | null;
}

export interface ManagementSession {
    drawDetails: WebData<DrawType>;
    betTypes: {
        loteria: string | null;
    };
    saveStatus: WebData<LoteriaBet | LoteriaBet[]>;
    saveSuccess: boolean;
    fetchExistingBets: boolean;
    isEditing: boolean;
}

export interface RulesSession {
    rulesList: WebData<{
        validationRules: any[];
        rewardRules: any[];
        structureName: string;
        drawName: string;
    }>;
    allRules: any[];
    stats: {
        validationCount: number;
        rewardCount: number;
        total: number;
    };
    isRefreshing: boolean;
    isRulesDrawerVisible: boolean;
    selectedRuleType: 'validation' | 'reward' | null;
    selectedRule: any | null;
    currentDrawId: string | null;
}

/**
 * Global Msg type using Wrapped Messages pattern (Elm style).
 * Each sub-module message is wrapped in its own variant.
 */
export type FeatureMsg =
    | LoteriaFeatMsg
    | { type: 'FETCH_DRAW_DETAILS_RESPONSE'; response: WebData<DrawType> }
    | { type: 'FETCH_BET_TYPES_RESPONSE'; response: WebData<GameType[]> }
    | { type: 'FETCH_EXISTING_BETS_RESPONSE'; response: WebData<LoteriaBet[]> }
    | { type: 'DRAW_INFO_RECEIVED'; webData: string };

export interface LoteriaSummary {
    loteriaTotal: number;
    hasBets: boolean;
    isSaving: boolean;
    error: string | null;
    pendingReceiptCode: string | null;
}

export interface LoteriaFeatureModel {
    // Core data
    currentDrawId: string | null;
    drawTypeCode: WebData<string>;
    isEditing: boolean;
    summary: LoteriaSummary;

    // Structure ID del usuario actual (para registro financiero)
    structureId: string | null;

    // Sessions (Internalized)
    loteriaSession: LoteriaState;
    editSession: EditSession;
    listSession: ListSession;
    entrySession: ListData;
    managementSession: ManagementSession;
    rulesSession: RulesSession;

    // Cache
    rules: RulesCache;
}

// ============================================================================
// Initial States (Internalized)
// ============================================================================

export const initialEditSession: EditSession = {
    selectedColumn: null,
    selectedCircle: null,
    isRangeMode: false,
    rangeType: null,
    currentNumber: '',
    currentAmount: '',
    rangeStartNumber: '',
    showRangeDialog: false,
    rangeBets: [],
    currentInput: '',
    showBetKeyboard: false,
    showAmountKeyboard: false,
    showParletKeyboard: false,
    betBuffer: [],
    editingBetId: null,
    editingAmountType: null,
    amountConfirmationDetails: null,
};

export const initialListSession: ListSession = {
    remoteData: RemoteData.notAsked(),
    aliasFilter: '',
    isRefreshing: false,
    loadedDrawId: null,
};

export const initialEntrySession: ListData = {
    loteria: [],
};

export const initialManagementSession: ManagementSession = {
    drawDetails: RemoteData.notAsked(),
    betTypes: {
        loteria: null,
    },
    saveStatus: RemoteData.notAsked(),
    saveSuccess: false,
    fetchExistingBets: true,
    isEditing: false,
};

export const initialRulesSession: RulesSession = {
    rulesList: RemoteData.notAsked(),
    allRules: [],
    stats: { validationCount: 0, rewardCount: 0, total: 0 },
    isRefreshing: false,
    isRulesDrawerVisible: false,
    selectedRuleType: null,
    selectedRule: null,
    currentDrawId: null,
};
