// UI State types - keyboard, drawer, modal states for bet editing
import { GameType } from '../../../../types';

export interface UiState {
    // Keyboard states
    showBetKeyboard: boolean;
    showAmountKeyboard: boolean;
    showParletKeyboard: boolean;

    // Buffer and editing state
    betBuffer: number[];
    editingBetId: string | null;
    editingAmountType: 'fijo' | 'corrido' | 'parlet' | null;

    // Amount confirmation
    amountConfirmationDetails: {
        amountValue: number;
        intendedAmountType: 'fijo' | 'corrido' | 'parlet';
        intendedBetId: string | null;
    } | null;

    // Parlet specific states
    potentialParletNumbers: number[];
    fromFijosyCorridoBet: boolean;
    parletAlertVisibleState: boolean;
    activeParletBetId: string | null;
    isParletDrawerVisible: boolean;
    isParletModalVisible: boolean;
    isAmmountDrawerVisible: boolean;
    activeAnnotationType: string | null;
    activeGameType: string | null;
    canceledFromFijosyCorridoBet: boolean;
}
