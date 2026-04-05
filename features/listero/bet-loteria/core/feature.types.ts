import { LoteriaFeatMsg, LoteriaState } from '../loteria/loteria.types';
import { WebData, RemoteData } from '@core/tea-utils';
import { LoteriaBet, DrawType, BetType, GameType } from '@/types';
import { RulesMsg } from '../../bet-workspace/rules/core/types';
import { RulesModel, initialRulesModel } from '../../bet-workspace/rules/core/model';

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
    betTypes: WebData<GameType[]>;
    saveStatus: WebData<LoteriaBet | LoteriaBet[]>;
    saveSuccess: boolean;
    fetchExistingBets: boolean;
    isEditing: boolean;
}

/**
 * Global Msg type using Wrapped Messages pattern (Elm style).
 * Each sub-module message is wrapped in its own variant.
 */
export type FeatureMsg =
    | { type: 'LOTERIA'; payload: LoteriaMsg }
    | { type: 'RULES'; payload: RulesMsg }
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
    userId: string | null;

    // Sessions (Internalized)
    loteriaSession: LoteriaState;
    editSession: EditSession;
    listSession: ListSession;
    entrySession: ListData;
    managementSession: ManagementSession;
    rulesSession: RulesModel;
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
    betTypes: RemoteData.notAsked(),
    saveStatus: RemoteData.notAsked(),
    saveSuccess: false,
    fetchExistingBets: true,
    isEditing: false,
};
