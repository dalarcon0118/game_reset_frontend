import { LoteriaFeatureModel } from './feature.types';
import { initialLoteriaState } from '../loteria/loteria.types';
import { RemoteData } from '@/shared/core/remote.data';

// ============================================================================
// Initial Model - Extracción para romper ciclo de dependencias
// Este archivo fue separado de store.ts para evitar:
// store.ts -> feature.update.ts -> feature.flows.ts -> store.ts
// ============================================================================

export const initialModel: LoteriaFeatureModel = {
    currentDrawId: null,
    drawTypeCode: RemoteData.notAsked(),
    isEditing: false,
    structureId: null, // Se establecerá desde el contexto de autenticación
    summary: {
        loteriaTotal: 0,
        hasBets: false,
        isSaving: false,
        error: null,
        pendingReceiptCode: null,
    },
    loteriaSession: initialLoteriaState,
    editSession: {
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
    },
    listSession: {
        remoteData: RemoteData.notAsked(),
        aliasFilter: '',
        isRefreshing: false,
        loadedDrawId: null,
    },
    entrySession: {
        loteria: [],
    },
    managementSession: {
        drawDetails: RemoteData.notAsked(),
        betTypes: {
            loteria: null,
        },
        saveStatus: RemoteData.notAsked(),
        saveSuccess: false,
        fetchExistingBets: true,
        isEditing: false,
    },
    rulesSession: {
        rulesList: RemoteData.notAsked(),
        allRules: [],
        stats: { validationCount: 0, rewardCount: 0, total: 0 },
        isRefreshing: false,
        isRulesDrawerVisible: false,
        selectedRuleType: null,
        selectedRule: null,
        currentDrawId: null,
    },
    rules: {
        status: RemoteData.notAsked()
    },
};
