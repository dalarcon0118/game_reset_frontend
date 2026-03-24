import { ParletBet, CentenaBet, FijosCorridosBet, GameType } from '@/types';
import { ExtendedDrawType } from '@/shared/repositories/draw/api/types/types';
import { WebData } from '@core/tea-utils';

// ============================================================================
// Core Domain Models
// ============================================================================

export interface BolitaListData {
    parlets: ParletBet[];
    centenas: CentenaBet[];
    fijosCorridos: FijosCorridosBet[];
}

export interface BolitaSummary {
    fijosCorridosTotal: number;
    parletsTotal: number;
    centenasTotal: number;
    grandTotal: number;
    hasBets: boolean;
    isSaving: boolean;
    pendingReceiptCode: string | null;
}

export interface BolitaListState {
    remoteData: WebData<BolitaListData>;
    aliasFilter: string;
    isRefreshing: boolean;
    loadedDrawId: string | null;
    summary: BolitaSummary;
}

export const PARLET_EDITING_TYPE = 'parlet';
export const CENTENA_EDITING_TYPE = 'centena';

export type InputOwner = 'fijos' | 'parlet' | 'centena';

export interface EditModel {
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
    activeOwner: InputOwner | null;
    showBetKeyboard: boolean;
    showAmountKeyboard: boolean;
    showParletKeyboard: boolean;
    betBuffer: number[];
    editingBetId: string | null;
    editingAmountType: 'fijo' | 'corrido' | 'parlet' | 'centena' | null;
    amountConfirmationDetails: {
        amountValue: number;
        intendedAmountType: 'fijo' | 'corrido' | 'parlet' | 'centena';
        intendedBetId: string | null;
    } | null;
}

// ============================================================================
// Sub-Feature Models
// ============================================================================

export interface ParletModel {
    potentialParletNumbers: number[];
    activeParletBetId: string | null;
    bulkEditingBetIds: string[];
    isParletDrawerVisible: boolean;
    isParletModalVisible: boolean;
    parletAlertVisibleState: boolean;
    usedFijosCombinations: string[];
    fromFijosyCorridoBet: boolean;
    canceledFromFijosyCorridoBet: boolean;
}

export interface CentenaModel {
    activeCentenaBetId: string | null;
    isCentenaDrawerVisible: boolean;
    isCentenaModalVisible: boolean;
    isAmountDrawerVisible: boolean;
    activeAnnotationType: string | null;
    activeGameType: GameType | null;
}

// ============================================================================
// Root Feature Model
// ============================================================================

export interface BolitaModel {
    isEditing: boolean;
    currentDrawId: string | null;
    userStructureId: number | null;
    drawDetails: WebData<ExtendedDrawType>;
    betTypes: WebData<GameType[]>;
    parletSession: ParletModel;
    centenaSession: CentenaModel;
    editState: EditModel;
    listState: BolitaListState;
    entrySession: BolitaListData;
    summary: BolitaSummary;
}
