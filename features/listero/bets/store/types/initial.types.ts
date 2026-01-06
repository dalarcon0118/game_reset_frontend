// Initial state - default values for the entire model
import { Model } from './model.types';

export const initialModel: Model = {
    // Core data
    drawId: null,
    betTypes: {
        fijo: null,
        corrido: null,
        parlet: null,
        centena: null,
    },
    fijosCorridos: [],
    parlets: [],
    centenas: [],
    isLoading: false,
    error: null,
    isSaving: false,
    saveSuccess: false,

    // UI State - Keyboard states
    showBetKeyboard: false,
    showAmountKeyboard: false,
    showParletKeyboard: false,
    betBuffer: [],
    editingBetId: null,
    editingAmountType: null,
    amountConfirmationDetails: null,

    // Parlet specific UI states
    potentialParletNumbers: [],
    fromFijosyCorridoBet: false,
    parletAlertVisibleState: false,
    activeParletBetId: null,
    isParletDrawerVisible: false,
    isParletModalVisible: false,
    isAmmountDrawerVisible: false,
    activeAnnotationType: null,
    activeGameType: null,
    canceledFromFijosyCorridoBet: false,

    // Create Session
    createSession: {
        selectedDrawId: null,
        selectedGameType: null,
        numbersPlayed: '',
        amount: '',
        tempBets: [],
    },

    // Edit Session
    editSession: {
        selectedColumn: null,
        selectedCircle: null,
        isRangeMode: false,
        rangeType: null,
        currentNumber: '',
        currentAmount: '',
        rangeStartNumber: '',
        showRangeDialog: false,
    },

    // Cache
    rewards: {
        data: null,
        isLoading: false,
        error: null,
    },
    rules: {
        data: null,
        isLoading: false,
        error: null,
    },
};
