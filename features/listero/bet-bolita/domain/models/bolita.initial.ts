import { RemoteData } from '@core/tea-utils';
import {
    BolitaModel,
    ParletModel,
    CentenaModel,
    EditModel,
    BolitaListState,
    BolitaListData
} from './bolita.types';

export const initialParletState: ParletModel = {
    potentialParletNumbers: [],
    activeParletBetId: null,
    bulkEditingBetIds: [],
    isParletDrawerVisible: false,
    isParletModalVisible: false,
    parletAlertVisibleState: false,
    usedFijosCombinations: [],
    fromFijosyCorridoBet: false,
    canceledFromFijosyCorridoBet: false,
};

export const initialCentenaState: CentenaModel = {
    activeCentenaBetId: null,
    isCentenaDrawerVisible: false,
    isCentenaModalVisible: false,
    isAmountDrawerVisible: false,
    activeAnnotationType: null,
    activeGameType: null,
};

export const initialEditState: EditModel = {
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
    activeOwner: null,
    showBetKeyboard: false,
    showAmountKeyboard: false,
    showParletKeyboard: false,
    betBuffer: [],
    editingBetId: null,
    editingAmountType: null,
    amountConfirmationDetails: null,
};

export const initialBolitaSummary: BolitaModel['summary'] = {
    fijosCorridosTotal: 0,
    parletsTotal: 0,
    centenasTotal: 0,
    grandTotal: 0,
    hasBets: false,
    isSaving: false,
    pendingReceiptCode: null,
};

export const initialBolitaListState: BolitaListState = {
    remoteData: RemoteData.notAsked(),
    aliasFilter: '',
    isRefreshing: false,
    loadedDrawId: null,
    summary: initialBolitaSummary,
};

export const initialBolitaListData: BolitaListData = {
    parlets: [],
    centenas: [],
    fijosCorridos: [],
};

export const initialBolitaModel: BolitaModel = {
    isEditing: false,
    currentDrawId: null,
    userStructureId: null,
    drawDetails: RemoteData.notAsked(),
    betTypes: RemoteData.notAsked(),
    parletSession: initialParletState,
    centenaSession: initialCentenaState,
    editState: initialEditState,
    listState: initialBolitaListState,
    entrySession: initialBolitaListData,
    summary: initialBolitaSummary,
};
