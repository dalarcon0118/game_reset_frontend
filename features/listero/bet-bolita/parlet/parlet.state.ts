import { BolitaModel as Model } from '../core/model';
import { PARLET_EDITING_TYPE } from './parlet.types';

export const ParletState = {
    /**
     * Transitions the state to the Amount Input mode.
     * Used when a bet is created or selected for editing amount.
     */
    toAmountInput: (model: Model, betId: string, initialInput: string = '', bulkIds: string[] = []): Model => ({
        ...model,
        editState: {
            ...model.editState,
            editingAmountType: PARLET_EDITING_TYPE,
            editingBetId: betId,
            currentInput: initialInput,
            showAmountKeyboard: true,
            showBetKeyboard: false,
        },
        parletSession: {
            ...model.parletSession,
            // Reset potential numbers as we are now editing a specific bet
            potentialParletNumbers: [],
            fromFijosyCorridoBet: false,
            parletAlertVisibleState: false,
            activeParletBetId: betId,
            bulkEditingBetIds: bulkIds,
        },
    }),

    /**
     * Transitions the state to the Bet Input mode (manual numbers entry).
     * Used when creating a new parlet manually or cancelling a flow.
     */
    toBetInput: (model: Model): Model => ({
        ...model,
        editState: {
            ...model.editState,
            showBetKeyboard: true,
            showAmountKeyboard: false,
            editingAmountType: PARLET_EDITING_TYPE,
            currentInput: '',
            editingBetId: null,
        },
        parletSession: {
            ...model.parletSession,
            activeParletBetId: null,
            bulkEditingBetIds: [],
        }
    }),

    /**
     * Closes all keyboards and resets editing state.
     */
    closeKeyboards: (model: Model): Model => ({
        ...model,
        editState: {
            ...model.editState,
            showAmountKeyboard: false,
            showBetKeyboard: false,
            editingBetId: null,
            editingAmountType: null,
            currentInput: '',
        },
        parletSession: {
            ...model.parletSession,
            bulkEditingBetIds: [],
        }
    }),

    /**
     * Updates the current input string in the edit session.
     */
    updateInput: (model: Model, newInput: string): Model => ({
        ...model,
        editState: {
            ...model.editState,
            currentInput: newInput,
        },
    }),

    /**
     * Sets the visibility of the Parlet Drawer.
     */
    setDrawerVisible: (model: Model, visible: boolean): Model => ({
        ...model,
        parletSession: {
            ...model.parletSession,
            isParletDrawerVisible: visible
        },
    }),

    /**
     * Sets the visibility of the Parlet Modal.
     */
    setModalVisible: (model: Model, visible: boolean): Model => ({
        ...model,
        parletSession: {
            ...model.parletSession,
            isParletModalVisible: visible
        },
    }),

    /**
     * Sets the visibility of the Parlet Alert.
     */
    setAlertVisible: (model: Model, visible: boolean): Model => ({
        ...model,
        parletSession: {
            ...model.parletSession,
            parletAlertVisibleState: visible,
        },
    }),

    /**
     * Specific state for when a parlet from Fijos/Corridos is cancelled.
     */
    cancelFijosFlow: (model: Model): Model => ({
        ...model,
        parletSession: {
            ...model.parletSession,
            potentialParletNumbers: [],
            fromFijosyCorridoBet: false,
            canceledFromFijosyCorridoBet: true
        },
        editState: {
            ...model.editState,
            showBetKeyboard: true,
            editingAmountType: PARLET_EDITING_TYPE,
            currentInput: '',
        }
    }),

    /**
     * Sets the potential numbers for a parlet (e.g. from Fijos/Corridos).
     */
    setPotentialNumbers: (model: Model, numbers: number[]): Model => ({
        ...model,
        editState: {
            ...model.editState,
            showBetKeyboard: false,
            editingAmountType: PARLET_EDITING_TYPE,
            currentInput: '',
        },
        parletSession: {
            ...model.parletSession,
            potentialParletNumbers: numbers,
            fromFijosyCorridoBet: true,
            parletAlertVisibleState: true,
        },
    }),

    /**
     * Sets the active parlet bet ID.
     */
    setActiveBet: (model: Model, betId: string): Model => ({
        ...model,
        parletSession: {
            ...model.parletSession,
            activeParletBetId: betId,
        },
        editState: {
            ...model.editState,
            editingAmountType: PARLET_EDITING_TYPE,
            editingBetId: betId,
        },
    }),
};
